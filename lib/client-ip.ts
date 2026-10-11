import "server-only";

type HeaderReader = { get(name: string): string | null };

/**
 * The client's IP address for rate limiting, or null when no trustworthy source exists.
 *
 * - On Vercel the edge network sets `x-real-ip` / `x-forwarded-for` itself and overwrites any
 *   value sent by the client, so they cannot be spoofed there.
 * - Elsewhere (local, self-hosted) those headers are client-controlled; only the header named in
 *   TRUSTED_IP_HEADER (set by your own reverse proxy) is used, otherwise null: per-IP limits are
 *   then skipped and only the per-account / per-phone limits apply.
 */
export function clientIp(headers: HeaderReader): string | null {
  if (process.env.VERCEL) {
    const ip = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0];
    return ip?.trim() || null;
  }
  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!trusted) return null;
  return headers.get(trusted)?.split(",")[0]?.trim() || null;
}
