// Keeps Vercel Preview deployments away from real data and real messages.
//
// A Preview must run on its own database (`fastburgers_preview`). It must not message the owner's
// Telegram or e-mail anyone, and it must not touch the Blob store. These rules do not depend on which
// environment variables happen to be set: a Preview build fails when DATABASE_URL names another
// database, a Preview refuses orders when it does, and the outgoing channels are closed in Preview
// whatever is configured. ORDER_MODE=live changes none of it.
//
// Plain JavaScript on purpose: scripts/check-env.mjs (runs before `next build`) and the app share it.
// Nothing here ever returns or logs the connection string, the user or the password.

export const PREVIEW_DATABASE_NAME = "fastburgers_preview";

/** True on a Vercel Preview deployment (Vercel sets VERCEL_ENV for builds and for running functions). */
export function isPreviewDeployment(env = process.env) {
  return env.VERCEL_ENV === "preview";
}

/**
 * The database name of a MongoDB connection string, read the way the format defines it: the path after the
 * host list (`mongodb://user:pass@h1:27017,h2:27017/NAME?options`, or `mongodb+srv://…`). Returns null when
 * the string is not a mongodb address or has no name. The host list may hold several hosts, so this is not
 * `new URL()`. Credentials are required to be percent-encoded, so the first "/" always starts the path.
 * The string is read exactly as Prisma receives it (no trimming): a stray space or newline would be part of
 * the name Prisma uses, so it must also make the check fail.
 */
export function databaseNameOf(url) {
  if (typeof url !== "string") return null;
  const match = /^mongodb(?:\+srv)?:\/\/([^/?#]*)\/([^?#]*)/i.exec(url);
  return match ? match[2] : null;
}

/**
 * Whether DATABASE_URL points at the Preview database. Strict: the path must be exactly
 * `fastburgers_preview` (case-sensitive, no encoded characters, no further path segments, no suffix or
 * prefix), so `fastburgers`, `fastburgers_preview2`, `x/fastburgers_preview`, `fastburgers_preview/`,
 * `FASTBURGERS_PREVIEW`, `fastburgers%5Fpreview` and a name hidden in the password or in a query option all fail.
 * The result carries a reason, never any part of the address.
 */
export function checkPreviewDatabase(env = process.env) {
  const url = env.DATABASE_URL;
  if (typeof url !== "string" || url.trim() === "") return { ok: false, reason: "DATABASE_URL is not set" };
  const name = databaseNameOf(url);
  if (name === null) return { ok: false, reason: "DATABASE_URL has no database name in the expected place" };
  if (name !== PREVIEW_DATABASE_NAME) return { ok: false, reason: `the database name is not exactly "${PREVIEW_DATABASE_NAME}"` };
  return { ok: true };
}

/** Preview and the database check did not pass: orders are refused. */
export function previewDatabaseBlocked(env = process.env) {
  return isPreviewDeployment(env) && !checkPreviewDatabase(env).ok;
}

/** Telegram, e-mail and Blob writes are off on every Preview, configured or not. */
export function outboundChannelsClosed(env = process.env) {
  return isPreviewDeployment(env);
}

/** Orders are tagged demo unless ORDER_MODE=live; a Preview order is always demo. */
export function ordersAreDemo(env = process.env) {
  return isPreviewDeployment(env) || env.ORDER_MODE?.trim() !== "live";
}
