import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";

/**
 * "Sign in with Google" — OpenID Connect authorization-code flow with PKCE, done by hand with
 * `jose` (no auth framework, so the site keeps its one session system).
 *
 *   1. /auth/google           creates state + nonce + PKCE verifier, keeps them in a short-lived
 *                             signed, httpOnly cookie, and redirects to Google.
 *   2. /auth/google/callback  checks `state` against that cookie, exchanges the code (with the
 *                             verifier and the client secret) and verifies the ID token: Google's
 *                             signature, issuer, audience, expiry, our nonce and a verified e-mail.
 *
 * Configured by GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (server-only). Nothing here logs tokens.
 */

export const GOOGLE_FLOW_COOKIE = "fb_google_flow";
export const GOOGLE_LINK_COOKIE = "fb_google_link";
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";
const FLOW_TTL_SECONDS = 10 * 60;
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export type GoogleConfig = { clientId: string; clientSecret: string };

export function readGoogleConfig(env: Record<string, string | undefined> = process.env): GoogleConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** What the visitor started: signing in (or up), or connecting Google to the signed-in account. */
export type GoogleIntent = "signin" | "link";

/** Kept in the signed flow cookie between the redirect to Google and the callback. */
export type GoogleFlow = { state: string; nonce: string; verifier: string; intent: GoogleIntent; next: string; locale: string };

/** The verified identity from Google's ID token. */
export type GoogleProfile = { sub: string; email: string; name: string };

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  return new TextEncoder().encode(secret);
}

const random = () => randomBytes(32).toString("base64url");

export function newGoogleFlow(intent: GoogleIntent, next: string, locale: string): GoogleFlow {
  return { state: random(), nonce: random(), verifier: random(), intent, next, locale };
}

/** Signs a small payload for one of the Google cookies; `purpose` keeps the two cookies apart. */
export async function sealGoogleCookie(purpose: "flow" | "link", payload: Record<string, unknown>, ttlSeconds = FLOW_TTL_SECONDS) {
  return new SignJWT({ ...payload, p: purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key());
}

export async function openGoogleCookie<T>(purpose: "flow" | "link", token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.p === purpose ? (payload as T) : null;
  } catch {
    return null;
  }
}

export const googleCookieOptions = (maxAge = FLOW_TTL_SECONDS) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Lax: sent on the top-level redirect back from Google, never on cross-site subrequests.
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function googleAuthorizationUrl(config: GoogleConfig, flow: GoogleFlow, redirectUri: string, loginHint?: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
    ...(loginHint ? { login_hint: loginHint } : {}),
  }).toString();
  return url.toString();
}

export function sameState(expected: string, received: string | null): boolean {
  if (!received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class GoogleAuthError extends Error {
  constructor(readonly code: "exchange" | "token" | "unverifiedEmail") {
    super(code);
  }
}

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Verifies Google's ID token and returns who signed in; throws GoogleAuthError otherwise. */
export async function verifyGoogleIdToken(idToken: string, config: GoogleConfig, nonce: string, keys: JWTVerifyGetKey = googleKeys): Promise<GoogleProfile> {
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, keys, { issuer: ISSUERS, audience: config.clientId, algorithms: ["RS256"], clockTolerance: 60 }));
  } catch {
    throw new GoogleAuthError("token");
  }
  if (typeof payload.nonce !== "string" || !sameState(nonce, payload.nonce)) throw new GoogleAuthError("token");
  if (typeof payload.sub !== "string" || !payload.sub || typeof payload.email !== "string") throw new GoogleAuthError("token");
  // Only an address Google has verified may identify or create an account.
  if (payload.email_verified !== true) throw new GoogleAuthError("unverifiedEmail");
  const email = payload.email.trim().toLowerCase();
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 80) : email.split("@")[0]!;
  return { sub: payload.sub, email, name };
}

/** Exchanges the authorization code for tokens and returns the verified profile. */
export async function exchangeGoogleCode(
  config: GoogleConfig,
  flow: GoogleFlow,
  code: string,
  redirectUri: string,
  fetchImpl: typeof fetch = fetch,
  keys?: JWTVerifyGetKey,
): Promise<GoogleProfile> {
  let response: Response;
  try {
    response = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: flow.verifier,
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GoogleAuthError("exchange");
  }
  const body = (await response.json().catch(() => null)) as { id_token?: unknown } | null;
  if (!response.ok || typeof body?.id_token !== "string") throw new GoogleAuthError("exchange");
  return verifyGoogleIdToken(body.id_token, config, flow.nonce, keys);
}
