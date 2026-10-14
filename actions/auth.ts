"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { consumeAll, RATE_LIMITS, resetLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/admin";
import { fill } from "@/lib/i18n/config";
import { translateAdminMessage } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";
import { authenticate } from "@/services/accounts";

export type LoginState = { error?: string; email?: string };

/** Staff sign-in (/admin/login): administrators only. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const { a } = await getAdminI18n();
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: translateAdminMessage(a, parsed.error.issues[0]?.message ?? a.login.invalid), email };

  // Brute-force guard, before any password check: per IP and per e-mail (existing or not, so the
  // answer never tells whether an account exists). Every attempt counts; a success clears the
  // account counter. The block lifts by itself when the window ends.
  const limited = await consumeAll([
    { rule: RATE_LIMITS.loginIp, id: clientIp(await headers()) },
    { rule: RATE_LIMITS.loginAccount, id: parsed.data.email },
  ]);
  if (!limited.ok) {
    const minutes = Math.ceil(limited.retryAfterSeconds / 60);
    return { error: fill(a.login.tooMany, { minutes }), email };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password, ["ADMIN"]);
  if (!user) return { error: a.login.wrong, email };

  await resetLimit(RATE_LIMITS.loginAccount, parsed.data.email);
  await createSession(user.id, "ADMIN", user.sessionVersion);
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
