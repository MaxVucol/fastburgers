import "server-only";
import sharp from "sharp";
import { Limiter, SingleFlight } from "@/lib/single-flight";
import { readFromDatabase, writeToDatabase } from "./db-cache";
import { MemoryImageCache, type CachedImage } from "./memory-cache";
import { OUTPUT_TYPE, type ImageRequest } from "./params";
import { loadSource } from "./source";

// The site's own image optimizer, in place of Vercel's /_next/image (which bills every distinct picture/width/
// quality as a "transformation"). A picture is looked for in three places before it is made:
//
//   browser   IndexedDB + the HTTP cache (components/ui/smart-image.tsx, lib/image-vault.ts)
//   L2        this server's memory         (memory-cache.ts)  - checked first on the server: it is the fastest
//   L1        the database                 (db-cache.ts)      - shared by all instances, survives deployments
//   made      sharp, with a single flight: one job per picture however many requests are waiting for it
//
// What is made is written back to both server layers.

export type Layer = "l2" | "l1" | "made";
export type Variant = CachedImage & { layer: Layer };

const MEMORY_BYTES = Number(process.env.IMAGE_CACHE_MEMORY_MB ?? 48) * 1024 * 1024;
const memory = new MemoryImageCache(Number.isFinite(MEMORY_BYTES) && MEMORY_BYTES > 0 ? MEMORY_BYTES : 48 * 1024 * 1024);
const flights = new SingleFlight<Variant | null>();
// Encoding a photo takes tens of megabytes; a menu opened for the first time asks for dozens at once.
const encoder = new Limiter(3);

/**
 * Tied to the deployment for the pictures shipped with the site, so a replaced file is not answered from an old copy
 * (see variantKey). Without a deployment (local `next start`) a fresh value per server start does the same.
 */
export const DEPLOYMENT_VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? `local-${Date.now()}`;

/** The picture for `key`, from the nearest layer that has it; made (once, whoever asks) when no layer does. Null: the original is unavailable. */
export async function getVariant(key: string, request: ImageRequest, requestOrigin: string): Promise<Variant | null> {
  const inMemory = memory.get(key);
  if (inMemory) return { ...inMemory, layer: "l2" };

  return flights.run(key, async () => {
    // A request that arrived while an earlier one for the same picture was finishing finds it in memory now.
    const again = memory.get(key);
    if (again) return { ...again, layer: "l2" };

    const stored = await readFromDatabase(key);
    if (stored) {
      memory.set(key, stored);
      return { ...stored, layer: "l1" };
    }

    const original = await loadSource(request.source, requestOrigin);
    if (!original) return null;
    const made = await encoder.run(() => encode(original, request));
    if (!made) return null;
    memory.set(key, made);
    // Awaited: a serverless function may be frozen the moment the response is sent, and an unfinished write would be lost.
    await writeToDatabase(key, made);
    return { ...made, layer: "made" };
  });
}

async function encode(original: Buffer, { width, quality }: ImageRequest): Promise<CachedImage | null> {
  try {
    const body = await sharp(original, { limitInputPixels: 80_000_000 }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    return { body, contentType: OUTPUT_TYPE };
  } catch {
    return null;
  }
}

/** For the tests: what the memory layer holds. */
export const memoryLayer = memory;
