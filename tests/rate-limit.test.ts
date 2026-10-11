// Unit tests of the rate-limit logic with the in-memory store (no database).
// They prove the counting rules, not the shared MongoDB store: see orders.integration.test.ts.
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.AUTH_SECRET ??= "unit-test-secret-unit-test-secret-0123";

const { consume, consumeAll, createMemoryRateLimitStore, resetLimit, RATE_LIMITS } = await import("@/lib/rate-limit");

const minute = 60_000;
const t0 = Date.UTC(2026, 0, 1, 12, 0, 0);

test("login: the 6th attempt for one account inside the window is refused, then allowed again", async () => {
  const store = createMemoryRateLimitStore();
  for (let i = 0; i < RATE_LIMITS.loginAccount.limit; i++) {
    assert.deepEqual(await consume(RATE_LIMITS.loginAccount, "admin@example.com", store, t0 + i), { ok: true });
  }
  const blocked = await consume(RATE_LIMITS.loginAccount, "admin@example.com", store, t0 + 10);
  assert.equal(blocked.ok, false);
  assert.ok(!blocked.ok && blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 15 * 60);
  // The block is temporary: a new window starts clean.
  assert.deepEqual(await consume(RATE_LIMITS.loginAccount, "admin@example.com", store, t0 + 16 * minute), { ok: true });
});

test("login: counters are per account and per IP, not one shared counter", async () => {
  const store = createMemoryRateLimitStore();
  for (let i = 0; i <= RATE_LIMITS.loginAccount.limit; i++) await consume(RATE_LIMITS.loginAccount, "a@example.com", store, t0);
  assert.deepEqual(await consume(RATE_LIMITS.loginAccount, "b@example.com", store, t0), { ok: true });
  // E-mail case and spaces do not create new counters.
  assert.equal((await consume(RATE_LIMITS.loginAccount, "  A@Example.com ", store, t0)).ok, false);
});

test("login: a success clears the account counter", async () => {
  const store = createMemoryRateLimitStore();
  for (let i = 0; i < RATE_LIMITS.loginAccount.limit; i++) await consume(RATE_LIMITS.loginAccount, "a@example.com", store, t0);
  await resetLimit(RATE_LIMITS.loginAccount, "a@example.com", store, t0);
  assert.deepEqual(await consume(RATE_LIMITS.loginAccount, "a@example.com", store, t0), { ok: true });
});

test("consumeAll counts every rule and skips missing ids (no trustworthy IP)", async () => {
  const store = createMemoryRateLimitStore();
  const checks = [
    { rule: RATE_LIMITS.orderIp, id: null },
    { rule: RATE_LIMITS.orderPhone, id: "0721000000" },
  ];
  for (let i = 0; i < RATE_LIMITS.orderPhone.limit; i++) assert.equal((await consumeAll(checks, store, t0)).ok, true);
  assert.equal((await consumeAll(checks, store, t0)).ok, false);
  assert.equal(store.size(), 1, "no counter for the missing IP");
});

test("parallel hits are each counted (store increments atomically)", async () => {
  const store = createMemoryRateLimitStore();
  const results = await Promise.all(
    Array.from({ length: 20 }, () => consume(RATE_LIMITS.orderIp, "203.0.113.7", store, t0)),
  );
  assert.equal(results.filter((r) => r.ok).length, RATE_LIMITS.orderIp.limit);
});

test("identifiers are stored only as a hash", async () => {
  const keys: string[] = [];
  const store = { hit: async (key: string) => (keys.push(key), 1), reset: async () => {} };
  await consume(RATE_LIMITS.loginIp, "203.0.113.7", store, t0);
  assert.ok(!keys[0].includes("203.0.113.7"));
});
