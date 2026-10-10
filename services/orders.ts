import "server-only";
import { randomInt } from "node:crypto";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDeliveryFee, MIN_DELIVERY_ORDER } from "@/lib/pricing";
import type { CheckoutData } from "@/lib/validation/checkout";

/** Codes map to dictionary keys (t.errors[code]); the action translates them for the customer. */
export type OrderErrorCode =
  | "productUnavailable"
  | "optionUnavailable"
  | "minDelivery"
  | "locationUnavailable"
  | "onlinePayment"
  | "saveFailed";

export class OrderError extends Error {
  constructor(
    readonly code: OrderErrorCode,
    readonly params: Record<string, string | number> = {},
  ) {
    super(code);
  }
}

const ORDER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L

function generateOrderNumber(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  return `FB-${out}`;
}

/**
 * Creates an order from validated checkout data. The client only sends product ids,
 * option ids and quantities — every price is looked up again here.
 */
export async function createOrder(data: CheckoutData, userId?: string) {
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true, category: { is: { active: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      price: true,
      options: { where: { active: true }, select: { id: true, name: true, price: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = data.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new OrderError("productUnavailable");
    }
    const optionIds = [...new Set(item.optionIds)];
    const options = optionIds.map((id) => {
      const option = product.options.find((o) => o.id === id);
      if (!option) {
        throw new OrderError("optionUnavailable", { name: product.name });
      }
      return { name: option.name, price: option.price };
    });
    const unitPrice = product.price + options.reduce((sum, o) => sum + o.price, 0);
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

  const deliveryFee = computeDeliveryFee(data.deliveryMethod, subtotal);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.order.create({
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
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          items: { create: items },
        },
        select: { id: true, number: true },
      });
    } catch (error) {
      const isNumberClash =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isNumberClash) throw error;
    }
  }
  throw new OrderError("saveFailed");
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

export async function listOrders(status?: OrderStatus, take = 100) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
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

export async function getDashboardStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [orderCount, openOrders, salesAgg, activeProducts, categoryCount, recentOrders, topItems] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } },
      }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.category.count(),
      listOrders(undefined, 6),
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { order: { is: { createdAt: { gte: since }, status: { not: "CANCELLED" } } } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  return {
    orderCount,
    openOrders,
    sales: salesAgg._sum.total ?? 0,
    activeProducts,
    categoryCount,
    recentOrders,
    topProducts: topItems.map((t) => ({
      productId: t.productId,
      name: t.productName,
      quantity: t._sum.quantity ?? 0,
      revenue: t._sum.total ?? 0,
    })),
  };
}
