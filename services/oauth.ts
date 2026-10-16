import "server-only";
import { Prisma } from "@prisma/client";
import type { GoogleProfile } from "@/lib/auth/google";
import { currentSessionVersion } from "@/lib/auth/session-version";
import { prisma } from "@/lib/prisma";

/**
 * Accounts and Google. A Google identity is found only by Google's stable id (`sub`) in
 * OAuthAccount — never by e-mail. The rules:
 *
 *  - a linked Google account signs in to its user (the role and session version come from the
 *    database, as for a password sign-in);
 *  - an unknown Google account whose e-mail is free creates a new CUSTOMER (never an administrator)
 *    with that verified e-mail;
 *  - an unknown Google account whose e-mail already belongs to an account is NOT linked
 *    automatically: the visitor must sign in to that account and confirm the link (with the
 *    account's password), see linkGoogleAccount;
 *  - administrators and blocked accounts cannot use Google (administrators sign in with their
 *    password at /admin/login).
 */

const PROVIDER = "google";

export type GoogleSignIn =
  | { kind: "signedIn" | "created"; userId: string; role: "CUSTOMER"; sessionVersion: number }
  | { kind: "emailExists" }
  | { kind: "notAllowed" };

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

async function linkedUser(sub: string) {
  const account = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId: sub } },
    select: { user: { select: { id: true, role: true, blockedAt: true, sessionVersion: true } } },
  });
  return account?.user ?? null;
}

function signedIn(user: { id: string; role: string; blockedAt: Date | null; sessionVersion: number | null }, kind: "signedIn" | "created"): GoogleSignIn {
  if (user.blockedAt || user.role !== "CUSTOMER") return { kind: "notAllowed" };
  return { kind, userId: user.id, role: "CUSTOMER", sessionVersion: currentSessionVersion(user.sessionVersion) };
}

export async function signInWithGoogle(profile: GoogleProfile): Promise<GoogleSignIn> {
  const existing = await linkedUser(profile.sub);
  if (existing) return signedIn(existing, "signedIn");

  // Same e-mail, different (or no) Google link: no automatic linking.
  const sameEmail = await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true } });
  if (sameEmail) return { kind: "emailExists" };

  try {
    const user = await prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        passwordHash: null,
        role: "CUSTOMER",
        sessionVersion: 0,
        // Google has verified the address (checked in verifyGoogleIdToken).
        emailVerifiedAt: new Date(),
        oauthAccounts: { create: { provider: PROVIDER, providerAccountId: profile.sub, email: profile.email } },
      },
      select: { id: true, role: true, blockedAt: true, sessionVersion: true },
    });
    return signedIn(user, "created");
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // A parallel callback for the same Google account won the race: use what it created.
    const raced = await linkedUser(profile.sub);
    return raced ? signedIn(raced, "signedIn") : { kind: "emailExists" };
  }
}

export type LinkResult = "linked" | "alreadyLinked" | "linkedElsewhere" | "hasOther" | "notAllowed";

/**
 * Connects a Google account to `userId`. The caller must already have re-authenticated the user
 * (signed in AND confirmed with the account password); this only enforces the data rules.
 */
export async function linkGoogleAccount(userId: string, profile: GoogleProfile): Promise<LinkResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, blockedAt: true } });
  if (!user || user.blockedAt || user.role !== "CUSTOMER") return "notAllowed";

  const owner = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId: profile.sub } },
    select: { userId: true },
  });
  if (owner) return owner.userId === userId ? "alreadyLinked" : "linkedElsewhere";
  if (await prisma.oAuthAccount.findFirst({ where: { userId, provider: PROVIDER }, select: { id: true } })) return "hasOther";

  try {
    await prisma.oAuthAccount.create({ data: { provider: PROVIDER, providerAccountId: profile.sub, userId, email: profile.email } });
    return "linked";
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return "linkedElsewhere";
  }
}

/** Disconnects Google. Refused while the account has no password (it could not sign in any more). */
export async function unlinkGoogleAccount(userId: string): Promise<"unlinked" | "needsPassword" | "none"> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) return "needsPassword";
  const { count } = await prisma.oAuthAccount.deleteMany({ where: { userId, provider: PROVIDER } });
  return count > 0 ? "unlinked" : "none";
}

/** The linked Google account of a user, for the profile page. */
export async function googleAccountOf(userId: string) {
  return prisma.oAuthAccount.findFirst({ where: { userId, provider: PROVIDER }, select: { email: true, createdAt: true } });
}
