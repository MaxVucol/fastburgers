/**
 * Session versions. Every session cookie carries the account's `sessionVersion` from when it was
 * issued; raising the version in the database (password change or reset, role change, block,
 * "sign out everywhere") makes every older cookie invalid.
 *
 * Accounts created before versions existed (and the seeded administrator) hold null or no value,
 * which counts as version 0.
 */
export function currentSessionVersion(stored: number | null | undefined): number {
  return stored ?? 0;
}

/** A cookie is valid only for the account's current version. */
export function isCurrentSession(stored: number | null | undefined, cookieVersion: number): boolean {
  return currentSessionVersion(stored) === cookieVersion;
}

/**
 * MongoDB filter for "no version stored" (null or missing field). Prisma's `increment` leaves such
 * a value null on MongoDB, so it must be set to 0 before incrementing (see revokeSessionsData).
 */
export const NO_SESSION_VERSION = { OR: [{ sessionVersion: null }, { sessionVersion: { isSet: false } }] };
