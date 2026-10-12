import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/jwt";
import { getI18n } from "@/lib/i18n/server";
import { safeNext } from "@/lib/validation/account";

/** Frame of the sign-in / sign-up / reset pages (centred card). */
export function AuthFrame({ children }: { children: ReactNode }) {
  return <div className="container-page flex justify-center pt-10 pb-20 sm:pt-16 sm:pb-28">{children}</div>;
}

/**
 * For sign-in and sign-up: a signed-in visitor goes straight to `next` (or the account).
 * Returns the sanitised `next` path and whether an old, no longer valid session cookie was sent
 * (shown as "your session has expired").
 */
export async function guestOnly(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const [{ href }, query, user, jar] = await Promise.all([getI18n(), searchParams, getSessionUser(), cookies()]);
  const nextRaw = typeof query.next === "string" ? query.next : undefined;
  const next = nextRaw ? safeNext(nextRaw, "") || undefined : undefined;
  if (user) redirect(next ?? href("/account"));
  return { next, expired: jar.has(SESSION_COOKIE), query };
}
