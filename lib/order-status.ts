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
  CONFIRMED: "bg-mustard-soft text-[#8a5a00]",
  PREPARING: "bg-mustard-soft text-[#8a5a00]",
  READY: "bg-herb-soft text-herb",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-herb-soft text-herb",
  CANCELLED: "bg-stone-200 text-stone-600",
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
