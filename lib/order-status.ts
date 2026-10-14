import type { OrderStatus, DeliveryMethod, PaymentMethod } from "@prisma/client";

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Nouă",
  CONFIRMED: "Confirmată",
  PREPARING: "În pregătire",
  READY: "Gata",
  OUT_FOR_DELIVERY: "În livrare",
  COMPLETED: "Finalizată",
  CANCELLED: "Anulată",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  NEW: "bg-accent-soft text-accent-ink",
  CONFIRMED: "bg-mustard-soft text-[#8a5a00] dark:text-[#e8b84a]",
  PREPARING: "bg-mustard-soft text-[#8a5a00] dark:text-[#e8b84a]",
  READY: "bg-herb-soft text-herb",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  COMPLETED: "bg-herb-soft text-herb",
  CANCELLED: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
};

export const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  DELIVERY: "Livrare la domiciliu",
  PICKUP: "Ridicare din restaurant",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Numerar la livrare / ridicare",
  CARD_ON_DELIVERY: "Card la livrare / ridicare",
  CARD_ONLINE: "Card online",
};

/**
 * Allowed status changes. Completed and cancelled orders are final; pick-up orders never go
 * "out for delivery", delivery orders are completed only after leaving with the courier.
 */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function nextStatuses(status: OrderStatus, method: DeliveryMethod): OrderStatus[] {
  return NEXT[status].filter((s) =>
    method === "PICKUP" ? s !== "OUT_FOR_DELIVERY" : !(status === "READY" && s === "COMPLETED"),
  );
}

export function canChangeStatus(from: OrderStatus, to: OrderStatus, method: DeliveryMethod) {
  return nextStatuses(from, method).includes(to);
}

/** Orders still in progress (counted as "active" on the dashboard). */
export const OPEN_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] as const satisfies readonly OrderStatus[];
