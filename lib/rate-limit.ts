import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting shared by every server instance.
 *
 * Counters live in MongoDB (the `RateLimit` collection), the one store all Vercel function
 * instances already share, so a limit holds across instances and cold starts. Each hit is a
 * single atomic `findAndModify` with `$inc` (upsert), so parallel requests cannot slip past it.
 * Identifiers (IP, e-mail, phone) are stored only as an HMAC, and each counter document
 * expires with its window (cleaned up lazily), so nothing is kept longer than the window.
 */

export type RateLimitRule = {
  /** Short name, part of the counter key. */
  name: string;
  /** Allowed hits per window. */
  limit: number;
  windowMs: number;
};

/** Counter storage; `hit` must be atomic. MongoDB in the app, an in-memory one in unit tests. */
export interface RateLimitStore {
  /** Adds one hit to `key` (created with `expiresAt` when missing) and returns the new count. */
  hit(key: string, expiresAt: Date): Promise<number>;
  reset(key: string): Promise<void>;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export const RATE_LIMITS = {
  /** Every admin sign-in attempt from one IP address. */
  loginIp: { name: "login-ip", limit: 10, windowMs: 15 * 60_000 },
  /** Sign-in attempts for one e-mail address (cleared after a successful sign-in). */
  loginAccount: { name: "login-account", limit: 5, windowMs: 15 * 60_000 },
  /** New accounts per IP address. */
  registerIp: { name: "register-ip", limit: 5, windowMs: 60 * 60_000 },
  /** Password-reset requests per IP and per e-mail address. */
  resetIp: { name: "reset-ip", limit: 5, windowMs: 60 * 60_000 },
  resetAccount: { name: "reset-account", limit: 3, windowMs: 60 * 60_000 },
  /** Verification e-mails per account: three an hour, and not two within a minute. */
  verifyAccount: { name: "verify-account", limit: 3, windowMs: 60 * 60_000 },
  verifyCooldown: { name: "verify-cooldown", limit: 1, windowMs: 60_000 },
  /** E-mail change requests per account. */
  emailChangeAccount: { name: "email-change-account", limit: 3, windowMs: 60 * 60_000 },
  /** "Sign in with Google" round trips per IP address (each callback may create an account). */
  googleIp: { name: "google-ip", limit: 20, windowMs: 10 * 60_000 },
  /** Order look-ups (number + phone) per IP address: a guess costs one try. */
  lookupIp: { name: "lookup-ip", limit: 15, windowMs: 10 * 60_000 },
  /** Orders that reach the database step, per IP address. */
  orderIp: { name: "order-ip", limit: 6, windowMs: 10 * 60_000 },
  /** Orders per phone number, whatever the address they come from. */
  orderPhone: { name: "order-phone", limit: 5, windowMs: 60 * 60_000 },
} satisfies Record<string, RateLimitRule>;

const COLLECTION = "RateLimit";

export const mongoRateLimitStore: RateLimitStore = {
  async hit(key, expiresAt) {
    const command = {
      findAndModify: COLLECTION,
      query: { _id: key },
      update: { $inc: { count: 1 }, $setOnInsert: { expiresAt: { $date: expiresAt.toISOString() } } },
      upsert: true,
      new: true,
    };
    let result;
    try {
      result = await prisma.$runCommandRaw(command);
    } catch {
      // Two first hits racing on a new key: one upsert inserts, the other gets a duplicate-key
      // error; repeating it now finds the document and increments it.
      result = await prisma.$runCommandRaw(command);
    }
    const value = (result as { value?: { count?: unknown } }).value;
    if (typeof value?.count !== "number") throw new Error("Rate limit store returned no count");
    // Occasionally drop counters of finished windows (keeps the collection at a few documents).
    if (Math.random() < 0.02) {
      await prisma
        .$runCommandRaw({
          delete: COLLECTION,
          deletes: [{ q: { expiresAt: { $lt: { $date: new Date().toISOString() } } }, limit: 0 }],
        })
        .catch(() => {});
    }
    return value.count;
  },
  async reset(key) {
    await prisma.$runCommandRaw({ delete: COLLECTION, deletes: [{ q: { _id: key }, limit: 1 }] });
  },
};

function digest(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set for rate limiting.");
  return createHmac("sha256", secret).update(value.trim().toLowerCase()).digest("base64url").slice(0, 22);
}

function windowKey(rule: RateLimitRule, id: string, now: number) {
  const index = Math.floor(now / rule.windowMs);
  return { key: `${rule.name}:${digest(id)}:${index}`, endsAt: (index + 1) * rule.windowMs };
}

/**
 * Counts one hit for `id` under `rule`. Over the limit it returns `ok: false` with the seconds
 * until the window ends (a short, self-expiring block, never a permanent one).
 */
export async function consume(
  rule: RateLimitRule,
  id: string,
  store: RateLimitStore = mongoRateLimitStore,
  now = Date.now(),
): Promise<RateLimitResult> {
  const { key, endsAt } = windowKey(rule, id, now);
  const count = await store.hit(key, new Date(endsAt));
  if (count <= rule.limit) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((endsAt - now) / 1000)) };
}

/** Clears the current window for `id` (e.g. the account counter after a successful sign-in). */
export async function resetLimit(
  rule: RateLimitRule,
  id: string,
  store: RateLimitStore = mongoRateLimitStore,
  now = Date.now(),
): Promise<void> {
  await store.reset(windowKey(rule, id, now).key);
}

/** Checks several rules and keys in order; the first one over its limit wins. */
export async function consumeAll(
  checks: { rule: RateLimitRule; id: string | null }[],
  store: RateLimitStore = mongoRateLimitStore,
  now = Date.now(),
): Promise<RateLimitResult> {
  let blocked: RateLimitResult = { ok: true };
  for (const { rule, id } of checks) {
    if (!id) continue;
    // Every rule counts the hit (no early return), so spreading attempts over keys does not help.
    const result = await consume(rule, id, store, now);
    if (!result.ok && blocked.ok) blocked = result;
  }
  return blocked;
}

/** In-memory store for unit tests only: it is per process, so it never protects a deployment. */
export function createMemoryRateLimitStore(): RateLimitStore & { size(): number } {
  const counters = new Map<string, number>();
  return {
    async hit(key) {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    },
    async reset(key) {
      counters.delete(key);
    },
    size: () => counters.size,
  };
}
