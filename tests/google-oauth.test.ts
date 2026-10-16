// "Sign in with Google" protocol checks, with no network: a local RSA key stands in for Google's
// signing keys, and a stub stands in for Google's token endpoint.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { before, describe, test } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";

process.env.AUTH_SECRET ??= "unit-test-secret-0123456789abcdefghij";

const google = await import("@/lib/auth/google");
const config = { clientId: "client-123.apps.googleusercontent.com", clientSecret: "test-secret" };

let keys: JWTVerifyGetKey;
let sign: (claims: Record<string, unknown>, opts?: { iss?: string; aud?: string; exp?: string }) => Promise<string>;

before(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  keys = createLocalJWKSet({ keys: [jwk] });
  sign = (claims, opts = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? "https://accounts.google.com")
      .setAudience(opts.aud ?? config.clientId)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(privateKey);
});

const claims = (nonce: string, over: Record<string, unknown> = {}) => ({
  sub: "1234567890",
  email: "Ana.Pop@gmail.com",
  email_verified: true,
  name: "Ana Pop",
  nonce,
  ...over,
});

describe("Google flow start", () => {
  test("authorization URL: code flow, PKCE S256, state, nonce, our redirect", () => {
    const flow = google.newGoogleFlow("signin", "/ru/account", "ru");
    const url = new URL(google.googleAuthorizationUrl(config, flow, "https://site.test/auth/google/callback"));
    assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    const p = url.searchParams;
    assert.equal(p.get("response_type"), "code");
    assert.equal(p.get("client_id"), config.clientId);
    assert.equal(p.get("redirect_uri"), "https://site.test/auth/google/callback");
    assert.equal(p.get("scope"), "openid email profile");
    assert.equal(p.get("state"), flow.state);
    assert.equal(p.get("nonce"), flow.nonce);
    assert.equal(p.get("code_challenge_method"), "S256");
    assert.equal(p.get("code_challenge"), createHash("sha256").update(flow.verifier).digest("base64url"));
    assert.equal(p.get("client_secret"), null, "the secret never goes to the browser");
    assert.ok(flow.state.length >= 40 && flow.nonce !== flow.state && flow.verifier !== flow.state, "independent random values");
  });

  test("flow cookie: signed, purpose-bound, tamper-proof", async () => {
    const flow = google.newGoogleFlow("link", "/account", "ro");
    const sealed = await google.sealGoogleCookie("flow", flow);
    assert.deepEqual((await google.openGoogleCookie<typeof flow>("flow", sealed))?.state, flow.state);
    assert.equal(await google.openGoogleCookie("link", sealed), null, "a flow cookie is not a link cookie");
    const [h, b, s] = sealed.split(".");
    const forged = JSON.parse(Buffer.from(b!, "base64url").toString());
    forged.state = "attacker";
    assert.equal(await google.openGoogleCookie("flow", `${h}.${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${s}`), null);
    assert.equal(await google.openGoogleCookie("flow", undefined), null);
    const expired = await google.sealGoogleCookie("flow", flow, -10);
    assert.equal(await google.openGoogleCookie("flow", expired), null, "expired");
  });

  test("state comparison", () => {
    assert.equal(google.sameState("abc", "abc"), true);
    assert.equal(google.sameState("abc", "abd"), false);
    assert.equal(google.sameState("abc", "ab"), false);
    assert.equal(google.sameState("abc", null), false);
  });
});

describe("Google ID token", () => {
  test("a valid token gives the verified profile (e-mail lower-cased)", async () => {
    const token = await sign(claims("n1"));
    assert.deepEqual(await google.verifyGoogleIdToken(token, config, "n1", keys), { sub: "1234567890", email: "ana.pop@gmail.com", name: "Ana Pop" });
  });

  test("wrong audience, issuer, nonce, expiry or signature are refused", async () => {
    const refused = { code: "token" };
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1"), { aud: "someone-else" }), config, "n1", keys), refused);
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1"), { iss: "https://evil.test" }), config, "n1", keys), refused);
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1")), config, "other-nonce", keys), refused);
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1"), { exp: "-5m" }), config, "n1", keys), refused);
    const { privateKey: otherKey } = await generateKeyPair("RS256");
    const foreign = await new SignJWT(claims("n1")).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer("https://accounts.google.com").setAudience(config.clientId).setExpirationTime("5m").sign(otherKey);
    await assert.rejects(google.verifyGoogleIdToken(foreign, config, "n1", keys), refused);
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1", { sub: "" })), config, "n1", keys), refused);
  });

  test("an e-mail Google has not verified cannot be used", async () => {
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1", { email_verified: false })), config, "n1", keys), { code: "unverifiedEmail" });
    await assert.rejects(google.verifyGoogleIdToken(await sign(claims("n1", { email_verified: "true" })), config, "n1", keys), { code: "unverifiedEmail" });
  });

  test("code exchange sends the PKCE verifier and secret server-to-server; errors become 'exchange'", async () => {
    const flow = google.newGoogleFlow("signin", "/account", "ro");
    let body = new URLSearchParams();
    const ok = (async (_url: unknown, init?: RequestInit) => {
      body = new URLSearchParams(String(init?.body));
      return Response.json({ id_token: await sign(claims(flow.nonce)), access_token: "x" });
    }) as typeof fetch;
    const profile = await google.exchangeGoogleCode(config, flow, "the-code", "https://site.test/auth/google/callback", ok, keys);
    assert.equal(profile.sub, "1234567890");
    assert.equal(body.get("code_verifier"), flow.verifier);
    assert.equal(body.get("client_secret"), config.clientSecret);
    assert.equal(body.get("grant_type"), "authorization_code");

    const denied = (async () => Response.json({ error: "invalid_grant" }, { status: 400 })) as typeof fetch;
    await assert.rejects(google.exchangeGoogleCode(config, flow, "used-code", "https://site.test/cb", denied, keys), { code: "exchange" });
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    await assert.rejects(google.exchangeGoogleCode(config, flow, "c", "https://site.test/cb", down, keys), { code: "exchange" });
  });

  test("configuration needs both the client id and the secret", () => {
    assert.equal(google.readGoogleConfig({}), null);
    assert.equal(google.readGoogleConfig({ GOOGLE_CLIENT_ID: "x" }), null);
    assert.deepEqual(google.readGoogleConfig({ GOOGLE_CLIENT_ID: " x ", GOOGLE_CLIENT_SECRET: "y" }), { clientId: "x", clientSecret: "y" });
  });
});
