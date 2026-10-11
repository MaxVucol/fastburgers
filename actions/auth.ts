"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { consumeAll, RATE_LIMITS, resetLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/admin";

export type LoginState = { error?: string; email?: string };

// Constant-time-ish failure path: always run a bcrypt compare so response timing
// does not reveal whether the email exists.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser-not-a-real-password", 12);

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide", email };

  // Brute-force guard, before any password check: per IP and per e-mail (existing or not, so the
  // answer never tells whether an account exists). Every attempt counts; a success clears the
  // account counter. The block lifts by itself when the window ends.
  const limited = await consumeAll([
    { rule: RATE_LIMITS.loginIp, id: clientIp(await headers()) },
    { rule: RATE_LIMITS.loginAccount, id: parsed.data.email },
  ]);
  if (!limited.ok) {
    const minutes = Math.ceil(limited.retryAfterSeconds / 60);
    return { error: `Prea multe încercări de autentificare. Încearcă din nou peste ${minutes} min.`, email };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true, passwordHash: true },
  });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || user.role !== "ADMIN") {
    return { error: "Email sau parolă incorectă.", email };
  }

  await resetLimit(RATE_LIMITS.loginAccount, parsed.data.email);
  await createSession(user.id, "ADMIN");
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
