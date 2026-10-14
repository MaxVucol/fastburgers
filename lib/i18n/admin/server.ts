import "server-only";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { cache } from "react";
import { ADMIN_LOCALE_COOKIE, adminDictionaries, resolveAdminLocale, type AdminDictionary } from "./index";

/** The admin panel's language for this request (cookie set by the panel's switcher). */
export const getAdminI18n = cache(async () => {
  const locale = resolveAdminLocale((await cookies()).get(ADMIN_LOCALE_COOKIE)?.value);
  return { locale, a: adminDictionaries[locale] };
});

/** Page title in the panel's language: `export const generateMetadata = () => adminTitle("orders")`. */
export async function adminTitle(key: keyof AdminDictionary["meta"]): Promise<Metadata> {
  const { a } = await getAdminI18n();
  return { title: a.meta[key] };
}
