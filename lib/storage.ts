import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Uploaded images are normalized to WebP and stored outside /public (files added to
// /public after build are not served). They are exposed through /media/[file].
// To move to S3/Cloudinary, replace these functions — callers only see URLs.

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MEDIA_PREFIX = "/media/";
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
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `${MEDIA_PREFIX}${name}`;
}

/** Deletes an uploaded image. Bundled demo images in /public are never touched. */
export async function deleteImage(url: string): Promise<void> {
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
