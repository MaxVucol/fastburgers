import { readMedia } from "@/lib/storage";

export async function GET(_request: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  const data = await readMedia(file);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      // File names are random UUIDs and never reused, so they are safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
