import { z } from "zod";
import { PAYMENT_BANKS } from "@/lib/payment-banks";
import { MAX_ITEM_QUANTITY } from "@/lib/pricing";
import { objectIdSchema } from "./common";

// Messages are dictionary keys (t.errors[key]) so the action can answer in the
// customer's language. Anything else falls back to t.errors.invalid.
export const CHECKOUT_ERROR_KEYS = ["name", "phone", "email", "address", "location", "notes", "cartEmpty", "bank"] as const;
export type CheckoutErrorKey = (typeof CHECKOUT_ERROR_KEYS)[number];

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{9,15}$/, "phone"));

export const checkoutItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
  optionIds: z.array(objectIdSchema).max(12),
  /** Unit price (bani) the customer was shown; only compared with the server price, never charged. */
  unitPrice: z.number().int().min(0).max(10_000_000).optional(),
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "name").max(80, "name"),
    customerPhone: phoneSchema,
    customerEmail: z.email("email").max(120, "email"),
    deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
    deliveryAddress: z.string().trim().max(200, "address").optional().default(""),
    locationId: z.string().optional().default(""),
    paymentMethod: z.enum(["CASH", "CARD_ON_DELIVERY", "CARD_ONLINE"]),
    /** Bank chosen for card payment (courier terminal or online link); ignored for cash. */
    paymentBank: z.enum(PAYMENT_BANKS).optional(),
    notes: z.string().trim().max(500, "notes").optional().default(""),
    items: z.array(checkoutItemSchema).min(1, "cartEmpty").max(50),
    /** Random id of this checkout attempt (crypto.randomUUID in the browser). */
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "DELIVERY" && data.deliveryAddress.length < 8) {
      ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "address" });
    }
    if (data.paymentMethod !== "CASH" && !data.paymentBank) {
      ctx.addIssue({ code: "custom", path: ["paymentBank"], message: "bank" });
    }
    if (data.deliveryMethod === "PICKUP" && !/^[a-f0-9]{24}$/i.test(data.locationId)) {
      ctx.addIssue({ code: "custom", path: ["locationId"], message: "location" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
