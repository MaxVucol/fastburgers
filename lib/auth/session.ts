import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./jwt";

export type AdminUser = { id: string; name: string; email: string };

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  emailVerified: boolean;
};

/** One cookie for staff and customers; its lifetime depends on the role. */
export async function createSession(userId: string, role: "ADMIN" | "CUSTOMER", version = 0) {
  const token = await signSession({ userId, role, version });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS[role],
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed-in user, verified against the database on every request (deduped per request):
 * the cookie must be valid, the user must exist and not be blocked, and the cookie's session
 * version must match (password change / block / "sign out everywhere" revoke older cookies).
 * The role always comes from the database, never from the cookie.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, sessionVersion: true, blockedAt: true, emailVerifiedAt: true },
  });
  if (!user || user.blockedAt || (user.sessionVersion ?? 0) !== session.version) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
});

/** Verifies the cookie AND re-checks the user's role in the database (deduped per request). */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, name: user.name, email: user.email };
});

/** Use in every admin page and Server Action — never trust the client or the proxy alone. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Account pages and actions: the signed-in user, or a redirect to the sign-in page of `locale`. */
export async function requireUser(loginPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(loginPath);
  return user;
}
