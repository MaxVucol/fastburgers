// Conditional requests and compression for the routes that serve files (/img, /media).
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);

/** Does an If-None-Match header name this ETag? Handles "*", lists and weak ("W/") validators. */
export function etagMatches(header: string | null, etag: string): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;
  const strip = (tag: string) => tag.trim().replace(/^W\//, "");
  return header.split(",").some((tag) => strip(tag) === strip(etag));
}

/** 304: the browser's copy is current. No body; the validators and the freshness lifetime are repeated. */
export function notModified(headers: Record<string, string>): Response {
  return new Response(null, { status: 304, headers });
}

/** Text-like types shrink under gzip; WebP, AVIF and JPEG are already compressed and only get slower and larger. */
export function isCompressible(contentType: string): boolean {
  return /^(?:text\/|application\/(?:json|javascript|xml)|image\/svg\+xml)/.test(contentType);
}

/** Bodies under this size are not worth the CPU. */
const MIN_GZIP_BYTES = 1024;

/** Gzips the body when the client accepts it and the type benefits. `encoding` is set only when it did. */
export async function encodeBody(
  acceptEncoding: string | null,
  contentType: string,
  body: Uint8Array,
): Promise<{ body: Uint8Array; encoding?: "gzip" }> {
  if (!isCompressible(contentType) || body.byteLength < MIN_GZIP_BYTES || !/\bgzip\b/.test(acceptEncoding ?? "")) return { body };
  return { body: await gzipAsync(body), encoding: "gzip" };
}
