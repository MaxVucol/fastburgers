// What /img?u=…&w=…&q=… is allowed to ask for, and the identity (cache key, ETag) of the answer.
// Plain functions with no imports from the app: the route, the unit tests and the cache layers share them.
import { createHash } from "node:crypto";
import { ALLOWED_WIDTHS, IMAGE_QUALITIES } from "@/lib/image-config";

/** Where the original lives: a picture shipped with the site, an admin upload on local disk, or in the Blob store. */
export type ImageSource =
  | { kind: "public"; path: string }
  | { kind: "media"; file: string }
  | { kind: "blob"; url: string };

export type ImageRequest = { source: ImageSource; src: string; width: number; quality: number };

const BLOB_SUFFIX = ".public.blob.vercel-storage.com";
const PUBLIC_PATH = /^\/images\/[^?#\\]+\.(?:png|jpe?g|webp|avif)$/i;
const MEDIA_FILE = /^\/media\/([a-f0-9-]{36}\.webp)$/;
const CONTROL_CHARS = /[\u0000-\u001f]/;
const RASTER_FILE = /\.(?:png|jpe?g|webp|avif)$/i;

/** Reads the three query parameters; null for anything the optimizer does not serve. */
export function parseImageRequest(params: URLSearchParams, blobHost: string): ImageRequest | null {
  const src = params.get("u");
  const width = Number(params.get("w"));
  const quality = Number(params.get("q") ?? 75);
  if (!src || src.length > 600) return null;
  if (!ALLOWED_WIDTHS.includes(width) || !IMAGE_QUALITIES.includes(quality)) return null;
  const source = parseSource(src, blobHost);
  return source ? { source, src, width, quality } : null;
}

function parseSource(src: string, blobHost: string): ImageSource | null {
  if (src.startsWith("/")) {
    const media = MEDIA_FILE.exec(src);
    if (media) return { kind: "media", file: media[1] };
    // No ".." segments, no doubled slashes, no control characters: the path stays inside /images.
    const clean = !src.split("/").some((part) => part === ".." || part === ".") && !src.includes("//") && !CONTROL_CHARS.test(src);
    return clean && PUBLIC_PATH.test(src) ? { kind: "public", path: src } : null;
  }
  try {
    const url = new URL(src);
    const hostOk = blobHost.startsWith("*") ? url.hostname.endsWith(BLOB_SUFFIX) : url.hostname === blobHost;
    const allowed = url.protocol === "https:" && hostOk && !url.username && !url.password && !url.port && RASTER_FILE.test(url.pathname);
    return allowed ? { kind: "blob", url: url.toString() } : null;
  } catch {
    return null;
  }
}

/** Every picture is produced as WebP: understood by every browser still in use, and one URL always means one answer (no Accept negotiation, so the browser can cache and revalidate it simply). */
export const OUTPUT_TYPE = "image/webp";

/**
 * Identity of one produced picture. `version` ties the pictures shipped with the site to the deployment that
 * carries them (a replaced file must not be answered from an older copy); uploads have unique names that are
 * never reused, so their version is fixed.
 */
export function variantKey(request: ImageRequest, version: string): string {
  const salt = request.source.kind === "public" ? version : "static";
  return createHash("sha256").update(`${salt}\n${request.src}\n${request.width}\n${request.quality}`).digest("hex").slice(0, 32);
}

/**
 * The ETag is a function of the key alone, so a revalidation (If-None-Match) is answered with a 304
 * without reading a cache or touching the picture at all.
 */
export function etagFor(key: string): string {
  return `"${key.slice(0, 24)}"`;
}
