import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { AuthTokenType, Role } from "@prisma/client";
import { currentSessionVersion, NO_SESSION_VERSION } from "@/lib/auth/session-version";
import { prisma } from "@/lib/prisma";
import { audit, type AuditActor } from "@/services/audit";

// Account rules shared by the customer pages and the admin panel. Server actions only parse
// input, check the caller and call these; the rules themselves live (and are tested) here.

const BCRYPT_COST = 12;
// Always run one bcrypt comparison so timing does not reveal whether an e-mail is registered.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser-not-a-real-password", BCRYPT_COST);

export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFY: 48 * 60 * 60 * 1000, // 2 days
  EMAIL_CHANGE: 60 * 60 * 1000, // 1 hour
};

export class AccountError extends Error {
  constructor(readonly code: "emailTaken" | "invalidToken" | "wrongPassword" | "self" | "lastAdmin" | "notFound" | "noPassword" | "sameEmail") {
    super(code);
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
/** MongoDB: "not set" covers both a stored null and a missing field (older documents). */
const unset = <T extends string>(field: T) => ({ OR: [{ [field]: null }, { [field]: { isSet: false } }] }) as Record<"OR", object[]>;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Update data that also ends every existing session of the user (`sessionVersion + 1`), merged
 * with `data`. An account without a stored version (null / missing — older accounts, the seeded
 * administrator) first gets 0: Prisma's increment would leave it null on MongoDB and no session
 * would ever be revoked. That step only touches a missing value, so repeating it is harmless; the
 * increment itself is one atomic update, so parallel revocations each count.
 */
async function revokeSessionsData<T extends object>(userId: string, data: T) {
  await prisma.user.updateMany({ where: { id: userId, ...NO_SESSION_VERSION }, data: { sessionVersion: 0 } });
  return { ...data, sessionVersion: { increment: 1 } };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function registerCustomer(input: { name: string; email: string; password: string; phone?: string | null }) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AccountError("emailTaken");
  try {
    return await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        passwordHash: await hashPassword(input.password),
        role: "CUSTOMER",
        sessionVersion: 0,
      },
      select: { id: true, name: true, email: true, role: true, sessionVersion: true },
    });
  } catch (error) {
    // Two registrations racing for one e-mail: the unique index rejects the second.
    if (error instanceof Error && "code" in error && error.code === "P2002") throw new AccountError("emailTaken");
    throw error;
  }
}

/** The user for these credentials, or null (wrong e-mail, wrong password or blocked — same answer). */
export async function authenticate(emailInput: string, password: string, roles: Role[] = ["CUSTOMER", "ADMIN"]) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(emailInput) },
    select: { id: true, role: true, passwordHash: true, blockedAt: true, sessionVersion: true },
  });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !valid || user.blockedAt || !roles.includes(user.role)) return null;
  return { id: user.id, role: user.role, sessionVersion: currentSessionVersion(user.sessionVersion) };
}

/**
 * New one-time token for `userId` (earlier unused ones of the type are revoked). Returns the raw
 * token; only its SHA-256 hash is stored. `newEmail` is the address an EMAIL_CHANGE token confirms.
 */
export async function issueToken(userId: string, type: AuthTokenType, now = Date.now(), newEmail?: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.updateMany({ where: { userId, type, ...unset("usedAt") }, data: { usedAt: new Date(now) } }),
    prisma.authToken.create({
      data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(now + TOKEN_TTL_MS[type]), usedAt: null, newEmail: newEmail ?? null },
    }),
  ]);
  return token;
}

/**
 * Uses a token once: a single atomic update marks it used only if it is unused and unexpired,
 * so two parallel requests cannot both succeed. Returns the user id, or throws invalidToken.
 */
export async function consumeToken(token: string, type: AuthTokenType, now = Date.now()) {
  return (await consumeTokenRow(token, type, now)).userId;
}

async function consumeTokenRow(token: string, type: AuthTokenType, now = Date.now()) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) throw new AccountError("invalidToken");
  const tokenHash = hashToken(token);
  const { count } = await prisma.authToken.updateMany({
    where: { tokenHash, type, expiresAt: { gt: new Date(now) }, ...unset("usedAt") },
    data: { usedAt: new Date(now) },
  });
  if (count !== 1) throw new AccountError("invalidToken");
  const row = await prisma.authToken.findUnique({ where: { tokenHash }, select: { userId: true, newEmail: true } });
  if (!row) throw new AccountError("invalidToken");
  return row;
}

/** Revokes every session of the user (cookies carry the old version). Returns the new version. */
export async function bumpSessionVersion(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: await revokeSessionsData(userId, {}),
    select: { sessionVersion: true },
  });
  return currentSessionVersion(user.sessionVersion);
}

/** Sets a new password from a reset link; all existing sessions end. */
export async function resetPasswordWithToken(token: string, password: string) {
  const userId = await consumeToken(token, "PASSWORD_RESET");
  const user = await prisma.user.update({
    where: { id: userId },
    data: await revokeSessionsData(userId, { passwordHash: await hashPassword(password) }),
    select: { id: true, role: true, sessionVersion: true, blockedAt: true },
  });
  return user;
}

export async function verifyEmailWithToken(token: string) {
  const userId = await consumeToken(token, "EMAIL_VERIFY");
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return userId;
}

/** Re-authentication: whether `password` is the account's current password (false without one). */
export async function verifyPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return Boolean(user?.passwordHash) && valid;
}

export type EmailChangeRequest =
  /** Send the confirmation link to the new address (and a notice to the old one). */
  | { send: true; token: string; oldEmail: string; newEmail: string }
  /** The address is taken by another account: send nothing, but answer exactly like `send`. */
  | { send: false };

/**
 * First step of an e-mail change: checks the current password and issues an EMAIL_CHANGE token
 * for the new address. The address changes only when that token is used (confirmEmailChange).
 */
export async function requestEmailChange(userId: string, newEmailInput: string, password: string): Promise<EmailChangeRequest> {
  const newEmail = normalizeEmail(newEmailInput);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true } });
  if (!user) throw new AccountError("notFound");
  if (!user.passwordHash) throw new AccountError("noPassword");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new AccountError("wrongPassword");
  if (newEmail === user.email) throw new AccountError("sameEmail");
  if (await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })) return { send: false };
  return { send: true, token: await issueToken(userId, "EMAIL_CHANGE", Date.now(), newEmail), oldEmail: user.email, newEmail };
}

/**
 * Second step: the link from the new address. Sets the e-mail (now verified) and voids every other
 * unused token of the account — links sent to the old address must not work for the new one.
 */
export async function confirmEmailChange(token: string, now = Date.now()) {
  const row = await consumeTokenRow(token, "EMAIL_CHANGE", now);
  if (!row.newEmail) throw new AccountError("invalidToken");
  try {
    await prisma.user.update({ where: { id: row.userId }, data: { email: row.newEmail, emailVerifiedAt: new Date(now) } });
  } catch (error) {
    // Someone registered the address meanwhile: the unique index refuses it.
    if (error instanceof Error && "code" in error && error.code === "P2002") throw new AccountError("emailTaken");
    throw error;
  }
  await prisma.authToken.updateMany({ where: { userId: row.userId, ...unset("usedAt") }, data: { usedAt: new Date(now) } });
  return { userId: row.userId, email: row.newEmail };
}

/** Changes the password (current one required); other sessions end, the new version is returned. */
export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) throw new AccountError("wrongPassword");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: await revokeSessionsData(userId, { passwordHash: await hashPassword(next) }),
    select: { sessionVersion: true },
  });
  return currentSessionVersion(updated.sessionVersion);
}

async function activeAdminCount(excludeId?: string) {
  return prisma.user.count({ where: { role: "ADMIN", ...unset("blockedAt"), NOT: excludeId ? { id: excludeId } : undefined } });
}

/**
 * Changes a user's role. Only callable by an administrator (checked by the caller); never on
 * oneself, and never removing the last active administrator. The user's sessions end.
 */
export async function setUserRole(actor: AuditActor, targetId: string, role: Role) {
  if (actor.id === targetId) throw new AccountError("self");
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true, email: true, blockedAt: true } });
  if (!target) throw new AccountError("notFound");
  if (target.role === role) return;
  if (target.role === "ADMIN" && !target.blockedAt && (await activeAdminCount(targetId)) === 0) throw new AccountError("lastAdmin");
  await prisma.user.update({ where: { id: targetId }, data: await revokeSessionsData(targetId, { role }) });
  await audit(actor, "user.role", "user", targetId, `${target.email}: ${target.role} → ${role}`);
}

/** Blocks / unblocks a user (not oneself, not the last active administrator); sessions end. */
export async function setUserBlocked(actor: AuditActor, targetId: string, blocked: boolean) {
  if (actor.id === targetId) throw new AccountError("self");
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true, email: true, blockedAt: true } });
  if (!target) throw new AccountError("notFound");
  if (Boolean(target.blockedAt) === blocked) return;
  if (blocked && target.role === "ADMIN" && (await activeAdminCount(targetId)) === 0) throw new AccountError("lastAdmin");
  await prisma.user.update({
    where: { id: targetId },
    data: await revokeSessionsData(targetId, { blockedAt: blocked ? new Date() : null }),
  });
  await audit(actor, blocked ? "user.block" : "user.unblock", "user", targetId, target.email);
}
