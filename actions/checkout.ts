"use server";

import { formatPrice } from "@/lib/format";
import { defaultLocale, fill, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CHECKOUT_ERROR_KEYS, checkoutSchema, type CheckoutErrorKey } from "@/lib/validation/checkout";
import { toFieldErrors, type ActionResult, type FieldErrors } from "@/lib/validation/common";
import { createOrder, OrderError } from "@/services/orders";

function isCheckoutKey(value: string | undefined): value is CheckoutErrorKey {
  return value != null && (CHECKOUT_ERROR_KEYS as readonly string[]).includes(value);
}

/**
 * Places an order. Input comes from the browser, so it is treated as untrusted:
 * it is validated with zod and every price is recomputed from the database.
 * `locale` only selects the language of the error messages.
 */
export async function placeOrder(input: unknown, locale?: string): Promise<ActionResult<{ number: string }>> {
  const lang = isLocale(locale) ? locale : defaultLocale;
  const t = getDictionary(lang);

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const [field, key] of Object.entries(toFieldErrors(parsed.error))) {
      fieldErrors[field] = isCheckoutKey(key) ? t.errors[key] : t.errors.invalid;
    }
    return { ok: false, error: t.errors.form, fieldErrors };
  }

  try {
    const order = await createOrder(parsed.data);
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    if (error instanceof OrderError) {
      const params = { ...error.params };
      if (typeof params.min === "number") params.min = formatPrice(params.min, lang);
      return { ok: false, error: fill(t.errors[error.code], params) };
    }
    console.error("placeOrder failed", error);
    return { ok: false, error: t.errors.unexpected };
  }
}
