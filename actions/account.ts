"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { defaultLocale, isLocale, localizePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { findOrderNumberByPhone } from "@/services/orders";

const lookupSchema = z.object({
  number: z.string().trim().toUpperCase().regex(/^FB-[A-Z0-9]{6,10}$/, "orderNumber"),
  phone: z.string().trim().min(9, "lookupPhone").max(20, "lookupPhone"),
});

export type LookupState = { error?: string };

/** Order lookup requires both the order number and the phone used at checkout. */
export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const rawLocale = formData.get("locale");
  const locale = typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = getDictionary(locale);

  const parsed = lookupSchema.safeParse({
    number: formData.get("number"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message;
    return { error: key === "orderNumber" || key === "lookupPhone" ? t.errors[key] : t.errors.invalid };
  }

  const number = await findOrderNumberByPhone(parsed.data.number, parsed.data.phone);
  if (!number) return { error: t.errors.orderNotFound };
  redirect(localizePath(locale, `/order/${number}`));
}
