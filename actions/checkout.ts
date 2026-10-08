"use server";

import { checkoutSchema } from "@/lib/validation/checkout";
import { toFieldErrors, type ActionResult } from "@/lib/validation/common";
import { createOrder, OrderError } from "@/services/orders";

/**
 * Places an order. Input comes from the browser, so it is treated as untrusted:
 * it is validated with zod and every price is recomputed from the database.
 */
export async function placeOrder(input: unknown): Promise<ActionResult<{ number: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifică datele marcate mai jos.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const order = await createOrder(parsed.data);
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("placeOrder failed", error);
    return { ok: false, error: "A apărut o eroare la plasarea comenzii. Te rugăm să încerci din nou." };
  }
}
