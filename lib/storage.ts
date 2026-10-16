import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import sharp from "sharp";

// Uploaded images are normalized to WebP. Two backends, chosen by environment —
// callers only ever see URLs:
//  - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (required on Vercel, whose
//    filesystem is read-only and not shared between function instances);
//  - local disk otherwise, stored outside /public (files added to /public after build
//    are not served) and exposed through /media/[file].

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MEDIA_PREFIX = "/media/";
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export class UploadError extends Error {}

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && value.size > 0;
}

export async function saveImage(file: File): Promise<string> {
  if (!ACCEPTED.has(file.type)) throw new UploadError("Format acceptat: JPG, PNG, WebP sau AVIF.");
  if (file.size > MAX_BYTES) throw new UploadError("Imaginea depășește 8 MB.");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadError("Fișierul nu este o imagine validă.");
  }

  const name = `${randomUUID()}.webp`;

  if (blobEnabled()) {
    try {
      const blob = await put(`uploads/${name}`, output, {
        access: "public",
        contentType: "image/webp",
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      return blob.url;
    } catch (error) {
      console.error("Blob upload failed", error instanceof Error ? error.name : "unknown error");
      throw new UploadError("Încărcarea imaginii a eșuat. Încearcă din nou.");
    }
  }

  if (process.env.VERCEL) {
    throw new UploadError(
      "Stocarea imaginilor nu este configurată: conectează un Vercel Blob store (BLOB_READ_WRITE_TOKEN).",
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `${MEDIA_PREFIX}${name}`;
}

/** Deletes an uploaded image. Bundled demo images in /public are never touched. */
export async function deleteImage(url: string): Promise<void> {
  if (isBlobUrl(url)) {
    if (blobEnabled()) await del(url).catch((error) => console.error("Blob delete failed", error instanceof Error ? error.name : "unknown error"));
    return;
  }
  const name = mediaFileName(url);
  if (!name) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined);
}

export function mediaFileName(url: string): string | null {
  if (!url.startsWith(MEDIA_PREFIX)) return null;
  const name = url.slice(MEDIA_PREFIX.length);
  return /^[a-f0-9-]{36}\.webp$/.test(name) ? name : null;
}

export async function readMedia(name: string): Promise<Buffer | null> {
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) return null;
  return readFile(path.join(UPLOAD_DIR, name)).catch(() => null);
}
