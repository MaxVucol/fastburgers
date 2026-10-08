import { z } from "zod";
import { objectIdSchema, slugSchema } from "./common";

const priceSchema = z
  .number({ error: "Preț invalid" })
  .int()
  .min(0, "Prețul nu poate fi negativ")
  .max(1_000_000, "Preț prea mare");

const optionalPositiveInt = z.number().int().min(0).max(100_000).nullable();

export const productOptionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Numele opțiunii lipsește").max(60),
  price: priceSchema,
  active: z.boolean(),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Numele este obligatoriu").max(80),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10, "Minim 10 caractere").max(160, "Maxim 160 de caractere"),
    description: z.string().trim().min(20, "Minim 20 de caractere").max(1200),
    price: priceSchema.min(1, "Prețul trebuie să fie mai mare decât 0"),
    oldPrice: priceSchema.nullable(),
    categoryId: objectIdSchema,
    ingredients: z.array(z.string().trim().min(1).max(60)).max(40),
    allergens: z.array(z.string().trim().min(1).max(40)).max(20),
    weight: optionalPositiveInt,
    weightUnit: z.enum(["g", "ml"]),
    calories: optionalPositiveInt,
    popular: z.boolean(),
    featured: z.boolean(),
    isNew: z.boolean(),
    active: z.boolean(),
    options: z.array(productOptionInputSchema).max(20),
  })
  .refine((p) => p.oldPrice == null || p.oldPrice > p.price, {
    path: ["oldPrice"],
    message: "Prețul vechi trebuie să fie mai mare decât prețul curent",
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu").max(40),
  slug: slugSchema,
  description: z.string().trim().max(240).default(""),
  active: z.boolean(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const loginSchema = z.object({
  email: z.email("Email invalid"),
  password: z.string().min(1, "Introdu parola").max(200),
});
