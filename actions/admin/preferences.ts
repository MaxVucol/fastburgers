"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { isLocale } from "@/lib/i18n/config";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n/admin";

/**
 * Remembers the admin panel's language (a display preference only — no data is changed, so it is
 * also available on the sign-in page). The current page re-renders in the new language.
 */
export async function setAdminLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  refresh();
}
