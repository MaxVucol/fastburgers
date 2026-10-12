import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fb_session";
/** Staff sessions stay short; customers stay signed in for a month. */
export const SESSION_TTL_SECONDS = { ADMIN: 60 * 60 * 8, CUSTOMER: 60 * 60 * 24 * 30 } as const;

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  /** The user's sessionVersion when the cookie was issued; a newer version in the database revokes it. */
  version: number;
};

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, sv: payload.version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS[payload.role]}s`)
    .sign(getKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || (role !== "ADMIN" && role !== "CUSTOMER")) return null;
    // Cookies issued before session versions existed carry no `sv`: version 0.
    const version = typeof payload.sv === "number" ? payload.sv : 0;
    return { userId: payload.sub, role, version };
  } catch {
    return null;
  }
}
