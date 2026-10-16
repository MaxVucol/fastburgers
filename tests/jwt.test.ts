// Unit tests of the session cookie (no database): a token signed by signSession verifies, and any
// token that is forged, expired, malformed or checked without a secret yields no session (sign-in again).
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { SignJWT } from "jose";
import { signSession, verifySession } from "@/lib/auth/jwt";

// node --test runs each file in its own process, so this secret stays local to these tests.
const SECRET = "test-secret-for-jwt-unit-tests-0123456789";
process.env.AUTH_SECRET = SECRET;
afterEach(() => {
  process.env.AUTH_SECRET = SECRET;
});

const key = (secret = SECRET) => new TextEncoder().encode(secret);
const ID = "000000000000000000000001";

test("a token from signSession verifies with its user, role and session version", async () => {
  const token = await signSession({ userId: ID, role: "ADMIN", version: 3 });
  assert.deepEqual(await verifySession(token), { userId: ID, role: "ADMIN", version: 3 });
});

test("a token signed with another secret or with a tampered signature gives no session", async () => {
  const foreign = await new SignJWT({ role: "ADMIN", sv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ID)
    .setExpirationTime("1h")
    .sign(key("another-secret-that-is-long-enough-0123456789"));
  assert.equal(await verifySession(foreign), null);

  const token = await signSession({ userId: ID, role: "ADMIN", version: 0 });
  const [header, payload, signature] = token.split(".");
  const flipped = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
  assert.equal(await verifySession(`${header}.${payload}.${flipped}`), null);
});

test("an expired token gives no session", async () => {
  const expired = await new SignJWT({ role: "ADMIN", sv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ID)
    .setIssuedAt(1)
    .setExpirationTime(2)
    .sign(key());
  assert.equal(await verifySession(expired), null);
});

test("malformed tokens, unknown roles and other algorithms give no session", async () => {
  assert.equal(await verifySession(undefined), null);
  assert.equal(await verifySession("not-a-jwt"), null);
  const badRole = await new SignJWT({ role: "ROOT" }).setProtectedHeader({ alg: "HS256" }).setSubject(ID).setExpirationTime("1h").sign(key());
  assert.equal(await verifySession(badRole), null);
  const hs512 = await new SignJWT({ role: "ADMIN" }).setProtectedHeader({ alg: "HS512" }).setSubject(ID).setExpirationTime("1h").sign(key());
  assert.equal(await verifySession(hs512), null, "only HS256 is accepted");
});

test("without AUTH_SECRET (or with a short one) nothing is signed and nothing verifies", async () => {
  const token = await signSession({ userId: ID, role: "CUSTOMER", version: 0 });
  for (const secret of [undefined, "too-short"]) {
    if (secret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = secret;
    assert.equal(await verifySession(token), null);
    await assert.rejects(signSession({ userId: ID, role: "CUSTOMER", version: 0 }), /AUTH_SECRET/);
  }
});

test("cookies issued before session versions existed count as version 0", async () => {
  const legacy = await new SignJWT({ role: "CUSTOMER" }).setProtectedHeader({ alg: "HS256" }).setSubject(ID).setExpirationTime("1h").sign(key());
  assert.deepEqual(await verifySession(legacy), { userId: ID, role: "CUSTOMER", version: 0 });
});
