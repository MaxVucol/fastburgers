// HTTP security headers and the image host the site trusts. Plain functions with no imports from the
// app, so next.config.ts can use them and the unit tests can check them.

const BLOB_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * The host of this project's Vercel Blob store (public product photos), taken from the store id that
 * is part of BLOB_READ_WRITE_TOKEN ("vercel_blob_rw_<storeId>_<secret>"). Without a usable token (local
 * work, preview builds without the variable) it falls back to every Blob store, as before.
 */
export function blobHostname(env: Record<string, string | undefined> = process.env): string {
  const storeId = env.BLOB_READ_WRITE_TOKEN?.trim().split("_")[3]?.toLowerCase();
  return storeId && /^[a-z0-9]{8,32}$/.test(storeId) ? `${storeId}${BLOB_SUFFIX}` : `*${BLOB_SUFFIX}`;
}

/**
 * Directives that are enforced. They change nothing the pages do today: no framing, no plugins, no
 * <base> hijacking, and forms can only post to this site (the Google button is a link, not a form).
 */
export const ENFORCED_CSP = ["base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'"].join("; ");

/**
 * The full policy, sent as Content-Security-Policy-Report-Only first: the browser reports what it
 * would block in the console without blocking anything. Next.js needs inline scripts and styles for
 * hydration and streaming (a nonce would make every page dynamic), so those stay allowed; everything
 * else is limited to this site, the data: images the page inlines, and this project's Blob store. The
 * directives that are already enforced (ENFORCED_CSP) are not repeated here.
 */
export function fullCsp(blobHost: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://${blobHost}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
  ].join("; ");
}

export type HeaderRule = { source: string; headers: { key: string; value: string }[] };

/** Headers for every page and route, ready for next.config.ts `headers()`. */
export function securityHeaders(blobHost: string = blobHostname()): HeaderRule {
  return {
    source: "/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), interest-cohort=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: ENFORCED_CSP },
      { key: "Content-Security-Policy-Report-Only", value: fullCsp(blobHost) },
    ],
  };
}
