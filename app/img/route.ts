import type { NextRequest } from "next/server";
import { encodeBody, etagMatches, notModified } from "@/lib/http-cache";
import { IMAGE_MAX_AGE } from "@/lib/image-config";
import { DEPLOYMENT_VERSION, getVariant } from "@/lib/image-optimizer";
import { etagFor, parseImageRequest, variantKey } from "@/lib/image-optimizer/params";
import { blobHostname } from "@/lib/security-headers";

// GET /img?u=<original>&w=<width>&q=<quality>: the site's picture optimizer (see lib/image-optimizer).
// Every answer carries an ETag that depends only on the request, so a browser or CDN that asks again after
// the month is up (If-None-Match) gets a 304 with no body, before any cache or the original is touched.

const CACHE_CONTROL = `public, max-age=${IMAGE_MAX_AGE}, s-maxage=${IMAGE_MAX_AGE}, stale-while-revalidate=86400`;

export async function GET(request: NextRequest) {
  const parsed = parseImageRequest(request.nextUrl.searchParams, blobHostname());
  if (!parsed) return new Response("Bad request", { status: 400, headers: { "Cache-Control": "no-store" } });

  const key = variantKey(parsed, DEPLOYMENT_VERSION);
  const etag = etagFor(key);
  const shared = { ETag: etag, "Cache-Control": CACHE_CONTROL };

  if (etagMatches(request.headers.get("if-none-match"), etag)) return notModified(shared);

  const variant = await getVariant(key, parsed, request.nextUrl.origin);
  if (!variant) {
    // The original could not be read or encoded: show it as it is rather than a broken picture, and ask again soon.
    const original = parsed.source.kind === "blob" ? parsed.source.url : encodeURI(parsed.src);
    return new Response(null, { status: 302, headers: { Location: original, "Cache-Control": "public, max-age=60" } });
  }

  const { body, encoding } = await encodeBody(request.headers.get("accept-encoding"), variant.contentType, variant.body);
  return new Response(new Uint8Array(body), {
    headers: {
      ...shared,
      ...(encoding ? { "Content-Encoding": encoding, Vary: "Accept-Encoding" } : {}),
      "Content-Type": variant.contentType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": "inline",
      // Which layer answered: l2 (server memory), l1 (database) or made (encoded just now).
      "X-Image-Cache": variant.layer,
    },
  });
}
