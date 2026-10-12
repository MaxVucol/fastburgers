import "server-only";
import { createHash, randomInt } from "node:crypto";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDeliveryFee, MIN_DELIVERY_ORDER } from "@/lib/pricing";
import { consumeAll, mongoRateLimitStore, RATE_LIMITS, type RateLimitStore } from "@/lib/rate-limit";
import { canChangeStatus, OPEN_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { CheckoutData } from "@/lib/validation/checkout";
import { audit, type AuditActor } from "@/services/audit";

/** Codes map to dictionary keys (t.errors[code]); the action translates them for the customer. */
export type OrderErrorCode =
  | "productUnavailable"
  | "optionUnavailable"
  | "priceChanged"
  | "minDelivery"
  | "locationUnavailable"
  | "onlinePayment"
  | "tooManyOrders"
  | "attemptMismatch"
  | "saveFailed";

/** Current prices of the ordered products, sent back when the cart's prices are out of date. */
export type PriceUpdate = { productId: string; price: number; options: { id: string; price: number }[] };

/** A cart line part that can no longer be ordered: the whole product, or one of its options. */
export type UnavailableItem = { productId: string; optionId?: string };

export type OrderErrorDetail = { prices?: PriceUpdate[]; unavailable?: UnavailableItem[] };

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  readonly params: Record<string, string | number>;
  readonly detail: OrderErrorDetail;

  constructor(code: OrderErrorCode, params: Record<string, string | number> = {}, detail: OrderErrorDetail = {}) {
    super(code);
    this.code = code;
    this.params = params;
    this.detail = detail;
  }
}

/** Who is ordering and how this attempt is identified. */
export type OrderContext = {
  userId?: string;
  /** Random id of this checkout attempt (made in the browser); retries of the attempt reuse it. */
  idempotencyKey?: string;
  /** Client IP for the per-IP limit; null when there is no trustworthy address (see clientIp). */
  ip?: string | null;
  /** Tag the order as placed on the demo site. */
  demo?: boolean;
  /** Counter storage; tests pass an in-memory one. */
  rateLimitStore?: RateLimitStore;
};

const ORDER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L

function generateOrderNumber(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  return `FB-${out}`;
}

/** What is ordered and how (not who): a replay of an attempt must match it. */
export function checkoutFingerprint(data: CheckoutData): string {
  const items = data.items
    .map((i) => `${i.productId}:${i.quantity}:${[...new Set(i.optionIds)].sort().join(",")}`)
    .sort();
  const payload = JSON.stringify([
    items,
    data.deliveryMethod,
    data.deliveryMethod === "PICKUP" ? data.locationId : "",
    data.paymentMethod,
  ]);
  return createHash("sha256").update(payload).digest("hex");
}

function uniqueTarget(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.join(",") : String(target ?? "");
}

/** MongoDB aborted one of two transactions writing the same document: look again or retry. */
function isWriteConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

/** The order an earlier run of this attempt created, if any (refused when the attempt differs). */
async function findReplay(key: string, fingerprint: string) {
  const request = await prisma.orderRequest.findUnique({ where: { key }, select: { fingerprint: true, orderId: true } });
  if (!request) return null;
  if (request.fingerprint !== fingerprint) throw new OrderError("attemptMismatch");
  const order = await prisma.order.findUnique({ where: { id: request.orderId }, select: { id: true, number: true } });
  if (!order) throw new OrderError("saveFailed");
  return order;
}

/**
 * Creates an order from validated checkout data. The client only sends product ids, option ids,
 * quantities and the unit prices it showed — every price is looked up again here, and the order
 * is refused (with the current prices) when one that was shown differs.
 *
 * Idempotent per `idempotencyKey`: the order, its lines and an OrderRequest record holding the key
 * are written in one transaction, and the key is unique in the database, so retries of one attempt
 * (even in parallel) produce a single order; a replay returns it. Rate limits are checked before
 * anything is written; replays do not count against them.
 */
export async function createOrder(data: CheckoutData, context: OrderContext = {}) {
  const { idempotencyKey: key, userId } = context;
  const fingerprint = checkoutFingerprint(data);
  if (key) {
    const replay = await findReplay(key, fingerprint);
    if (replay) return replay;
  }

  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true, category: { is: { active: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      price: true,
      soldOut: true,
      options: { where: { active: true }, select: { id: true, name: true, price: true } },
    },
  });
  // A sold-out dish is listed but cannot be ordered: treat it like an unavailable one.
  const byId = new Map(products.filter((p) => !p.soldOut).map((p) => [p.id, p]));

  // Everything that can no longer be ordered, reported at once so the cart can be fixed in one go.
  const unavailable: UnavailableItem[] = [];
  const add = (entry: UnavailableItem) => {
    if (!unavailable.some((u) => u.productId === entry.productId && u.optionId === entry.optionId)) unavailable.push(entry);
  };
  for (const item of data.items) {
    const product = byId.get(item.productId);
    if (!product) {
      add({ productId: item.productId });
      continue;
    }
    for (const optionId of item.optionIds) {
      if (!product.options.some((o) => o.id === optionId)) add({ productId: item.productId, optionId });
    }
  }
  if (unavailable.length > 0) {
    const onlyOptions = unavailable.every((u) => u.optionId);
    const name = byId.get(unavailable[0].productId)?.name ?? "";
    throw new OrderError(onlyOptions ? "optionUnavailable" : "productUnavailable", { name }, { unavailable });
  }

  // Set when a price the customer saw differs from the current one (cart kept from before a change).
  let repriced = false;
  const items = data.items.map((item) => {
    const product = byId.get(item.productId)!;
    const options = [...new Set(item.optionIds)].map((id) => {
      const option = product.options.find((o) => o.id === id)!;
      return { name: option.name, price: option.price };
    });
    const unitPrice = product.price + options.reduce((sum, o) => sum + o.price, 0);
    if (item.unitPrice !== undefined && item.unitPrice !== unitPrice) repriced = true;
    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: product.image,
      quantity: item.quantity,
      price: unitPrice,
      options,
      total: unitPrice * item.quantity,
    };
  });

  // Never charge a total the customer has not seen: send the current prices back to be confirmed.
  if (repriced) {
    const prices = products.map((p) => ({
      productId: p.id,
      price: p.price,
      options: p.options.map((o) => ({ id: o.id, price: o.price })),
    }));
    throw new OrderError("priceChanged", {}, { prices });
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  if (data.deliveryMethod === "DELIVERY" && subtotal < MIN_DELIVERY_ORDER) {
    throw new OrderError("minDelivery", { min: MIN_DELIVERY_ORDER });
  }

  let locationId: string | null = null;
  if (data.deliveryMethod === "PICKUP") {
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, active: true },
      select: { id: true },
    });
    if (!location) throw new OrderError("locationUnavailable");
    locationId = location.id;
  }

  if (data.paymentMethod === "CARD_ONLINE") {
    // Integration point: create a payment intent with the provider (Stripe, Netopia…)
    // and keep the order in NEW until the webhook confirms the payment.
    throw new OrderError("onlinePayment");
  }

  // Spam guard, after the checks above and before any write: per IP and per phone number.
  const limited = await consumeAll(
    [
      { rule: RATE_LIMITS.orderIp, id: context.ip ?? null },
      { rule: RATE_LIMITS.orderPhone, id: data.customerPhone },
    ],
    context.rateLimitStore ?? mongoRateLimitStore,
  );
  if (!limited.ok) throw new OrderError("tooManyOrders", { minutes: Math.ceil(limited.retryAfterSeconds / 60) });

  const deliveryFee = computeDeliveryFee(data.deliveryMethod, subtotal);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // One transaction: the order, its lines (nested create) and the attempt record — or nothing.
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            number: generateOrderNumber(),
            userId: userId ?? null,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail.toLowerCase(),
            deliveryMethod: data.deliveryMethod,
            deliveryAddress: data.deliveryMethod === "DELIVERY" ? data.deliveryAddress : null,
            locationId,
            paymentMethod: data.paymentMethod,
            notes: data.notes || null,
            demo: context.demo ? true : undefined,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            items: { create: items },
          },
          select: { id: true, number: true },
        });
        if (key) await tx.orderRequest.create({ data: { key, fingerprint, orderId: order.id } });
        return order;
      });
    } catch (error) {
      const target = uniqueTarget(error);
      // The same attempt committed in parallel (unique key, or MongoDB's write conflict): return its order.
      if (key && ((target !== null && target.includes("key")) || isWriteConflict(error))) {
        const replay = await findReplay(key, fingerprint);
        if (replay) return replay;
        if (isWriteConflict(error)) continue;
      }
      // Order number clash (1 in ~850 billion): draw another one.
      if (target !== null && target.includes("number")) continue;
      throw error;
    }
  }
  throw new OrderError("saveFailed");
}

export class StatusChangeError extends Error {
  constructor(readonly code: "notFound" | "notAllowed" | "conflict") {
    super(code);
  }
}

/**
 * Moves an order to `to` if the transition is allowed from its current status. The update is
 * conditional on the status read (compare-and-set), so two admins changing it at once cannot both
 * succeed or skip a step. The change is written to the audit log.
 */
export async function changeOrderStatus(actor: AuditActor, id: string, to: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id }, select: { number: true, status: true, deliveryMethod: true } });
  if (!order) throw new StatusChangeError("notFound");
  if (!canChangeStatus(order.status, to, order.deliveryMethod)) throw new StatusChangeError("notAllowed");
  const { count } = await prisma.order.updateMany({ where: { id, status: order.status }, data: { status: to } });
  if (count !== 1) throw new StatusChangeError("conflict");
  await audit(actor, "order.status", "order", id, `${order.number}: ${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[to]}`);
}

/** Public order tracking: limited fields, no contact details. */
export async function getOrderForTracking(number: string) {
  return prisma.order.findUnique({
    where: { number },
    select: {
      number: true,
      status: true,
      customerName: true,
      deliveryMethod: true,
      paymentMethod: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      location: { select: { name: true, address: true } },
      items: {
        select: {
          id: true,
          productName: true,
          productSlug: true,
          image: true,
          quantity: true,
          price: true,
          total: true,
          options: true,
        },
      },
    },
  });
}

export async function findOrderNumberByPhone(number: string, phone: string) {
  const normalized = phone.replace(/[\s().-]/g, "");
  const order = await prisma.order.findFirst({
    where: { number: number.trim().toUpperCase(), customerPhone: normalized },
    select: { number: true },
  });
  return order?.number ?? null;
}

// ───────────── Admin queries ─────────────

export type OrderFilters = {
  status?: OrderStatus;
  /** Order number, customer name or phone (partial, case-insensitive). */
  q?: string;
  from?: Date;
  to?: Date;
  /** "real": placed with ORDER_MODE=live; "demo": tagged demo orders; undefined: both. */
  kind?: "real" | "demo";
};

function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const q = f.q?.trim();
  const and: Prisma.OrderWhereInput[] = [];
  if (f.status) and.push({ status: f.status });
  if (f.from || f.to) and.push({ createdAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lt: f.to } : {}) } });
  // Orders from before the demo flag existed have no `demo` field at all: they count as real.
  if (f.kind === "demo") and.push({ demo: true });
  if (f.kind === "real") and.push({ OR: [{ demo: false }, { demo: null }, { demo: { isSet: false } }] });
  if (q) {
    and.push({
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q.replace(/[\s().-]/g, "") } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export async function listOrders(filters: OrderStatus | OrderFilters = {}, take = 100) {
  const f: OrderFilters = typeof filters === "string" ? { status: filters } : filters;
  return prisma.order.findMany({
    where: orderWhere(f),
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      number: true,
      customerName: true,
      customerPhone: true,
      deliveryMethod: true,
      status: true,
      total: true,
      demo: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, location: true },
  });
}

/**
 * Dashboard figures for orders created in [from, to). Rules (shown on the page as well):
 * - revenue = sum of order totals (food + delivery fee) of the period's orders that are not
 *   cancelled; "completed revenue" counts only completed orders;
 * - average ticket = revenue / number of non-cancelled orders;
 * - new / in progress = the orders in those statuses right now, whatever their date;
 * - best sellers = quantities of the period's non-cancelled order lines (snapshot names).
 * There is no refund status in the order model, so refunds are not tracked.
 */
export async function getDashboardStats(filters: { from: Date; to: Date; kind?: "real" | "demo" }) {
  const period = orderWhere({ from: filters.from, to: filters.to, kind: filters.kind });
  const now = orderWhere({ kind: filters.kind });
  const notCancelled = { ...period, status: { not: "CANCELLED" as const } };
  const [byStatus, revenueAgg, completedAgg, newNow, openNow, topItems, recentOrders] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: period, _count: { _all: true } }),
    prisma.order.aggregate({ where: notCancelled, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...period, status: "COMPLETED" }, _sum: { total: true } }),
    prisma.order.count({ where: { ...now, status: "NEW" } }),
    prisma.order.count({ where: { ...now, status: { in: [...OPEN_STATUSES] } } }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { is: notCancelled } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
    listOrders({ kind: filters.kind }, 6),
  ]);
  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Partial<Record<OrderStatus, number>>;
  const orderCount = byStatus.reduce((sum, r) => sum + r._count._all, 0);
  const paidCount = revenueAgg._count._all;
  const revenue = revenueAgg._sum.total ?? 0;
  return {
    orderCount,
    cancelled: counts.CANCELLED ?? 0,
    counts,
    revenue,
    completedRevenue: completedAgg._sum.total ?? 0,
    averageTicket: paidCount > 0 ? Math.round(revenue / paidCount) : 0,
    newNow,
    openNow,
    recentOrders,
    topProducts: topItems.map((t) => ({
      productId: t.productId,
      name: t.productName,
      quantity: t._sum.quantity ?? 0,
      revenue: t._sum.total ?? 0,
    })),
  };
}

/** Catalog items needing attention: hidden, drafts, temporarily unavailable. */
export async function getCatalogAttention() {
  return prisma.product.findMany({
    where: { OR: [{ active: false }, { draft: true }, { soldOut: true }] },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: { id: true, name: true, active: true, draft: true, soldOut: true },
  });
}
