import { createHash } from "node:crypto";
import { etagMatches, notModified } from "@/lib/http-cache";
import { readMedia } from "@/lib/storage";

// File names are random UUIDs and never reused, so they are safe to cache forever, and the name alone identifies the bytes:
// a revalidation is answered with a 304 before the file is read.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET(request: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  const etag = `"${createHash("sha256").update(file).digest("hex").slice(0, 24)}"`;
  if (etagMatches(request.headers.get("if-none-match"), etag)) return notModified({ ETag: etag, "Cache-Control": CACHE_CONTROL });

  const data = await readMedia(file);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": CACHE_CONTROL, ETag: etag },
  });
}
