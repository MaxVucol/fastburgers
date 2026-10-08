import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fb_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
};

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || (role !== "ADMIN" && role !== "CUSTOMER")) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}
