import { z } from "zod";
import { phoneSchema } from "./checkout";

// Messages are keys of t.me.errors so the server answers in the customer's language.
export const ACCOUNT_ERROR_KEYS = ["name", "email", "phone", "password", "required", "label", "address"] as const;
export type AccountErrorKey = (typeof ACCOUNT_ERROR_KEYS)[number];

const email = z.string().trim().toLowerCase().pipe(z.email("email").max(120, "email"));
/** 8–200 characters with at least one letter and one digit. */
export const passwordSchema = z
  .string()
  .min(8, "password")
  .max(200, "password")
  .refine((v) => /\p{L}/u.test(v) && /\d/.test(v), "password");
const name = z.string().trim().min(2, "name").max(80, "name");
/** Same rule as the checkout phone, but may be left empty (null). */
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || phoneSchema.safeParse(v).success, "phone")
  .transform((v) => (v === "" ? null : phoneSchema.parse(v)));

export const registerSchema = z.object({ name, email, phone: optionalPhone, password: passwordSchema });
export const signInSchema = z.object({ email, password: z.string().min(1, "required").max(200, "required") });
export const forgotSchema = z.object({ email });
export const emailChangeSchema = z.object({ email, password: z.string().min(1, "required").max(200, "required") });
export const googleLinkSchema = z.object({ password: z.string().min(1, "required").max(200, "required") });
export const resetSchema = z.object({ token: z.string().min(20).max(100), password: passwordSchema });
export const profileSchema = z.object({ name, phone: optionalPhone });
export const passwordChangeSchema = z.object({ current: z.string().min(1, "required").max(200), next: passwordSchema });
export const addressSchema = z.object({
  label: z.string().trim().min(1, "label").max(40, "label"),
  address: z.string().trim().min(8, "address").max(200, "address"),
});

/** Only same-site paths are followed after sign-in (no "//host" or absolute URLs). */
export function safeNext(value: unknown, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  return /^\/(?!\/)[\w\-./?=&%]*$/.test(next) && !next.includes("\\") ? next : fallback;
}
