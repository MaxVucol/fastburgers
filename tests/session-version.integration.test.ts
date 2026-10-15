// Session revocation for accounts without a stored session version (null or missing field — older
// accounts and the seeded administrator). Prisma's `increment` leaves such a value null on MongoDB,
// which used to keep old sessions alive. Unit part always runs; the rest needs the TEST database
// (TEST_DATABASE_URL, name containing "test").
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { isCurrentSession } from "@/lib/auth/session-version";

describe("session version check", () => {
  test("no stored version counts as 0", () => {
    assert.equal(isCurrentSession(null, 0), true);
    assert.equal(isCurrentSession(undefined, 0), true);
    assert.equal(isCurrentSession(null, 1), false);
    assert.equal(isCurrentSession(2, 2), true);
    assert.equal(isCurrentSession(3, 2), false);
  });
});

const url = process.env.TEST_DATABASE_URL ?? "";
const usable = /test/i.test(new URL(url || "mongodb://x/none").pathname);

describe("session revocation with sessionVersion = null (integration, test database)", { skip: usable ? false : "TEST_DATABASE_URL (a *test* database) is not set" }, () => {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";

  let accounts: typeof import("@/services/accounts");
  let prisma: typeof import("@/lib/prisma").prisma;
  const created: string[] = [];
  // Role and block changes are made by another administrator (never by the account itself).
  const actor = { id: "665f000000000000000000aa", email: "qa-actor@example.com" };
  const PASSWORD = "Parola123qa";

  before(async () => {
    accounts = await import("@/services/accounts");
    prisma = (await import("@/lib/prisma")).prisma;
  });
  after(async () => {
    await prisma.authToken.deleteMany({ where: { userId: { in: created } } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  /** A customer whose session version is stored as null, or not stored at all. */
  async function legacyUser(kind: "null" | "missing") {
    const email = `sv-${kind}-${randomUUID().slice(0, 8)}@example.com`;
    const user = await prisma.user.create({
      data: { name: "Legacy", email, role: "CUSTOMER", passwordHash: await accounts.hashPassword(PASSWORD), sessionVersion: null },
      select: { id: true },
    });
    created.push(user.id);
    if (kind === "missing") {
      await prisma.$runCommandRaw({ update: "User", updates: [{ q: { email }, u: { $unset: { sessionVersion: "" } } }] });
    }
    return { id: user.id, email };
  }

  const stored = async (id: string) => (await prisma.user.findUnique({ where: { id }, select: { sessionVersion: true } }))?.sessionVersion;

  /** The version a sign-in puts into the cookie, i.e. what an existing session carries. */
  async function signInVersion(email: string, password = PASSWORD) {
    const user = await accounts.authenticate(email, password);
    assert.ok(user, "can sign in");
    return user.sessionVersion;
  }

  for (const kind of ["null", "missing"] as const) {
    test(`${kind}: signing in works and the session is valid`, async () => {
      const u = await legacyUser(kind);
      const cookie = await signInVersion(u.email);
      assert.equal(cookie, 0);
      assert.equal(isCurrentSession(await stored(u.id), cookie), true);
    });

    test(`${kind}: "sign out everywhere" revokes the old session`, async () => {
      const u = await legacyUser(kind);
      const old = await signInVersion(u.email);
      const fresh = await accounts.bumpSessionVersion(u.id);
      assert.equal(fresh, 1);
      assert.equal(await stored(u.id), 1);
      assert.equal(isCurrentSession(await stored(u.id), old), false, "old session no longer valid");
      assert.equal(isCurrentSession(await stored(u.id), fresh), true, "the session issued after it is valid");
    });

    test(`${kind}: password change revokes old sessions and keeps the new one`, async () => {
      const u = await legacyUser(kind);
      const old = await signInVersion(u.email);
      const fresh = await accounts.changePassword(u.id, PASSWORD, "AltaParola456");
      assert.equal(fresh, 1);
      assert.equal(isCurrentSession(await stored(u.id), old), false);
      assert.equal(isCurrentSession(await stored(u.id), fresh), true);
      assert.equal(await signInVersion(u.email, "AltaParola456"), 1, "a new sign-in gets the new version");
      assert.equal(await accounts.authenticate(u.email, PASSWORD), null, "the old password no longer works");
    });

    test(`${kind}: password reset by link revokes old sessions`, async () => {
      const u = await legacyUser(kind);
      const old = await signInVersion(u.email);
      const token = await accounts.issueToken(u.id, "PASSWORD_RESET");
      const result = await accounts.resetPasswordWithToken(token, "NouaParola789");
      assert.equal(result.sessionVersion, 1);
      assert.equal(isCurrentSession(await stored(u.id), old), false);
    });

    test(`${kind}: role change revokes old sessions`, async () => {
      const u = await legacyUser(kind);
      const old = await signInVersion(u.email);
      await accounts.setUserRole(actor, u.id, "ADMIN");
      assert.equal(await stored(u.id), 1);
      assert.equal(isCurrentSession(await stored(u.id), old), false);
      // Back to customer (other administrators exist in the test database), revoked again.
      await accounts.setUserRole(actor, u.id, "CUSTOMER");
      assert.equal(await stored(u.id), 2);
    });

    test(`${kind}: blocking revokes old sessions, and a blocked account cannot sign in`, async () => {
      const u = await legacyUser(kind);
      const old = await signInVersion(u.email);
      await accounts.setUserBlocked(actor, u.id, true);
      assert.equal(await stored(u.id), 1);
      assert.equal(isCurrentSession(await stored(u.id), old), false);
      assert.equal(await accounts.authenticate(u.email, PASSWORD), null);
    });
  }

  test("parallel revocations on a null version are all counted (no lost update)", async () => {
    const u = await legacyUser("null");
    await Promise.all(Array.from({ length: 6 }, () => accounts.bumpSessionVersion(u.id)));
    assert.equal(await stored(u.id), 6);
  });

  test("an existing version is incremented, never reset to 0", async () => {
    const u = await legacyUser("null");
    await prisma.user.update({ where: { id: u.id }, data: { sessionVersion: 3 } });
    assert.equal(await accounts.bumpSessionVersion(u.id), 4);
  });
});
