import { z } from "zod";
import { MAX_ITEM_QUANTITY } from "@/lib/pricing";
import { objectIdSchema } from "./common";

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{9,15}$/, "Introdu un număr de telefon valid"));

export const checkoutItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
  optionIds: z.array(objectIdSchema).max(12),
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Introdu numele complet").max(80),
    customerPhone: phoneSchema,
    customerEmail: z.email("Introdu o adresă de email validă").max(120),
    deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
    deliveryAddress: z.string().trim().max(200).optional().default(""),
    locationId: z.string().optional().default(""),
    paymentMethod: z.enum(["CASH", "CARD_ON_DELIVERY", "CARD_ONLINE"]),
    notes: z.string().trim().max(500, "Maxim 500 de caractere").optional().default(""),
    items: z.array(checkoutItemSchema).min(1, "Coșul este gol").max(50),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "DELIVERY" && data.deliveryAddress.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Introdu adresa completă (stradă, număr, bloc, apartament)",
      });
    }
    if (data.deliveryMethod === "PICKUP" && !/^[a-f0-9]{24}$/i.test(data.locationId)) {
      ctx.addIssue({ code: "custom", path: ["locationId"], message: "Alege restaurantul" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
