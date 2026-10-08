// Shared by client (cart preview) and server (authoritative order totals).

/** Delivery fee in bani. */
export const DELIVERY_FEE = 999;
/** Orders at or above this subtotal (bani) get free delivery. */
export const FREE_DELIVERY_THRESHOLD = 8000;
/** Minimum subtotal for home delivery (bani). */
export const MIN_DELIVERY_ORDER = 3000;
export const MAX_ITEM_QUANTITY = 20;

export type DeliveryMethodValue = "DELIVERY" | "PICKUP";

export function computeDeliveryFee(method: DeliveryMethodValue, subtotal: number): number {
  if (method === "PICKUP") return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
