"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ordersAreDemo, previewDatabaseBlocked } from "@/lib/preview-guard.mjs";
import { clientIp } from "@/lib/client-ip";
import { formatPrice } from "@/lib/format";
import { defaultLocale, fill, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CHECKOUT_ERROR_KEYS, checkoutSchema, type CheckoutErrorKey } from "@/lib/validation/checkout";
import { toFieldErrors, type ActionResult, type FieldErrors } from "@/lib/validation/common";
import { sendNewOrderEmails } from "@/services/order-emails";
import { notifyNewOrder } from "@/services/order-notifications";
import { createOrder, OrderError, type PriceUpdate, type UnavailableItem } from "@/services/orders";

export type CheckoutResult =
  | ActionResult<{ number: string }>
  | { ok: false; error: string; prices?: PriceUpdate[]; unavailable?: UnavailableItem[] };

function isCheckoutKey(value: string | undefined): value is CheckoutErrorKey {
  return value != null && (CHECKOUT_ERROR_KEYS as readonly string[]).includes(value);
}

/** Orders are tagged as demo orders unless ORDER_MODE=live (see .env.example); a Preview order is always a demo order. */
const isDemo = () => ordersAreDemo();

/**
 * Places an order. Input comes from the browser, so it is treated as untrusted:
 * it is validated with zod and every price is recomputed from the database.
 * `locale` only selects the language of the error messages.
 */
export async function placeOrder(input: unknown, locale?: string): Promise<CheckoutResult> {
  const lang = isLocale(locale) ? locale : defaultLocale;
  const t = getDictionary(lang);

  // A Preview that is not on its own database takes no orders (and reads nothing: this runs first).
  if (previewDatabaseBlocked()) {
    console.error("placeOrder refused: this Preview deployment is not on the separate Preview database");
    return { ok: false, error: t.errors.previewDatabase };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const [field, key] of Object.entries(toFieldErrors(parsed.error))) {
      fieldErrors[field] = isCheckoutKey(key) ? t.errors[key] : t.errors.invalid;
    }
    return { ok: false, error: t.errors.form, fieldErrors };
  }

  try {
    // The owner comes from the verified session only — never from the request body.
    const user = await getSessionUser();
    const order = await createOrder(parsed.data, {
      userId: user?.id,
      idempotencyKey: parsed.data.idempotencyKey,
      ip: clientIp(await headers()),
      demo: isDemo(),
      locale: lang,
    });
    // Only reached once the order is saved. Runs after the response is sent (on Vercel within the
    // function's time limit); a replayed attempt returns the same order and is not notified twice.
    after(() => notifyNewOrder(order.id));
    // E-mails are separate tasks, so a mail problem never affects the Telegram message (or the order).
    after(() => sendNewOrderEmails(order.id));
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    if (error instanceof OrderError) {
      const params = { ...error.params };
      if (typeof params.min === "number") params.min = formatPrice(params.min, lang);
      return { ok: false, error: fill(t.errors[error.code], params), ...error.detail };
    }
    // Name and code only: a database error can carry the submitted values (name, phone, address).
    console.error("placeOrder failed", error instanceof Error ? error.name : "unknown error", (error as { code?: unknown })?.code ?? "");
    return { ok: false, error: t.errors.unexpected };
  }
}
