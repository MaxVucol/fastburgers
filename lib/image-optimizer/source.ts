import "server-only";
import { readMedia } from "@/lib/storage";
import type { ImageSource } from "./params";

/** Largest original the optimizer reads. The admin form limits uploads to 8 MB; the pictures shipped with the site are smaller. */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Where this server fetches the pictures shipped in /public from. In production it is never taken from the request
 * (a forged Host header could otherwise send the server anywhere, and its answer would be cached for everyone): on
 * Vercel it is this very deployment, elsewhere the server's own loopback address. Only `next dev`, whose port is
 * not known in advance, uses the address the request came to.
 */
function ownOrigin(requestOrigin: string): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV !== "production") return requestOrigin;
  return `http://127.0.0.1:${process.env.PORT ?? 3000}`;
}

/** The original's bytes, or null when it cannot be had (the caller then sends the browser to the original). */
export async function loadSource(source: ImageSource, requestOrigin: string): Promise<Buffer | null> {
  if (source.kind === "media") return readMedia(source.file);
  const url = source.kind === "blob" ? source.url : `${ownOrigin(requestOrigin)}${encodeURI(source.path)}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "error" });
    if (!response.ok) return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_SOURCE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.byteLength > MAX_SOURCE_BYTES ? null : bytes;
  } catch {
    return null;
  }
}
