import "server-only";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orderWhere, type OrderFilters } from "@/services/orders";

// Read-only figures for the admin overview and order list. Everything is computed from saved
// orders and accounts; nothing here writes, and the order rules stay in services/orders.ts.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type SalesPoint = { start: string; revenue: number; orders: number };

/**
 * Non-cancelled orders of [from, to) in equal buckets: hours for a single day, days otherwise.
 * Revenue follows the overview's rule (order totals, cancelled orders excluded).
 */
export async function getSalesSeries(filters: { from: Date; to: Date; kind?: "real" | "demo" }): Promise<{ unit: "hour" | "day"; points: SalesPoint[] }> {
  const span = filters.to.getTime() - filters.from.getTime();
  const unit = span <= DAY ? "hour" : "day";
  const step = unit === "hour" ? HOUR : DAY;
  const count = Math.max(1, Math.ceil(span / step));
  const points: SalesPoint[] = Array.from({ length: count }, (_, i) => ({
    start: new Date(filters.from.getTime() + i * step).toISOString(),
    revenue: 0,
    orders: 0,
  }));
  const rows = await prisma.order.findMany({
    where: { ...orderWhere({ from: filters.from, to: filters.to, kind: filters.kind }), status: { not: "CANCELLED" } },
    select: { createdAt: true, total: true },
    take: 50_000,
  });
  for (const row of rows) {
    const i = Math.floor((row.createdAt.getTime() - filters.from.getTime()) / step);
    const point = points[i];
    if (!point) continue;
    point.revenue += row.total;
    point.orders += 1;
  }
  return { unit, points };
}

/** Customer accounts registered in [from, to). */
export function countNewCustomers(from: Date, to: Date) {
  return prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: from, lt: to } } });
}

/** Orders waiting for confirmation right now (for the navigation badge and the bell). */
export function countNewOrders() {
  return prisma.order.count({ where: { status: "NEW" } });
}

/** Per order: the first lines ("2 × Classic Smash") and how many more there are. */
export async function getOrderItemSummaries(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, { lines: string[]; more: number }>();
  const items = await prisma.orderItem.findMany({
    where: { orderId: { in: orderIds } },
    select: { orderId: true, productName: true, quantity: true },
    orderBy: { id: "asc" },
  });
  const map = new Map<string, { lines: string[]; more: number }>();
  for (const item of items) {
    const entry = map.get(item.orderId) ?? { lines: [], more: 0 };
    if (entry.lines.length < 2) entry.lines.push(`${item.productName} ×${item.quantity}`);
    else entry.more += 1;
    map.set(item.orderId, entry);
  }
  return map;
}

/** Number of orders per status for the given filters (status itself ignored), for the tabs. */
export async function getOrderStatusCounts(filters: Omit<OrderFilters, "status">) {
  const rows = await prisma.order.groupBy({ by: ["status"], where: orderWhere(filters), _count: { _all: true } });
  const counts = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Partial<Record<OrderStatus, number>>;
  return { counts, total: rows.reduce((sum, r) => sum + r._count._all, 0) };
}

/** Current photos of the given products (best sellers keep only a name snapshot). */
export async function getProductThumbs(ids: string[]) {
  const rows = ids.length ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, image: true } }) : [];
  return new Map(rows.map((r) => [r.id, r.image]));
}
