import "server-only";
import { prisma } from "@/lib/prisma";
import type { CachedImage } from "./memory-cache";

// L1: the database. Produced pictures are kept in MongoDB (the `ImageCache` collection), the one store every
// function instance already shares, so a picture is encoded once for the whole site and survives deployments
// and cold starts. Like the rate limiter it talks to MongoDB with raw commands: no model, no `db push`.
// A failing database never fails a picture: every call here ends in "not cached" rather than an error.

const COLLECTION = "ImageCache";
const TTL_MS = 35 * 24 * 60 * 60 * 1000;
/** A picture larger than this stays in memory only (MongoDB documents are limited to 16 MB; photos are far below). */
const MAX_STORED_BYTES = 1_500_000;

type Binary = { $binary?: { base64?: unknown } };

export async function readFromDatabase(key: string): Promise<CachedImage | null> {
  try {
    const result = (await prisma.$runCommandRaw({
      find: COLLECTION,
      filter: { _id: key, expiresAt: { $gt: { $date: new Date().toISOString() } } },
      projection: { data: 1, contentType: 1 },
      limit: 1,
    })) as { cursor?: { firstBatch?: { data?: Binary; contentType?: unknown }[] } };
    const doc = result.cursor?.firstBatch?.[0];
    const base64 = doc?.data?.$binary?.base64;
    if (typeof base64 !== "string" || typeof doc?.contentType !== "string") return null;
    return { body: Buffer.from(base64, "base64"), contentType: doc.contentType };
  } catch (error) {
    report("read", error);
    return null;
  }
}

export async function writeToDatabase(key: string, image: CachedImage): Promise<void> {
  if (image.body.byteLength > MAX_STORED_BYTES) return;
  const now = Date.now();
  try {
    await prisma.$runCommandRaw({
      update: COLLECTION,
      updates: [
        {
          q: { _id: key },
          // Two instances making the same picture at once: the second finds the first one's document and changes nothing.
          u: {
            $setOnInsert: {
              contentType: image.contentType,
              data: { $binary: { base64: image.body.toString("base64"), subType: "00" } },
              size: image.body.byteLength,
              createdAt: { $date: new Date(now).toISOString() },
              expiresAt: { $date: new Date(now + TTL_MS).toISOString() },
            },
          },
          upsert: true,
        },
      ],
    });
    // Now and then drop pictures of finished lifetimes (older deployments' copies of the shipped photos).
    if (Math.random() < 0.02) {
      await prisma.$runCommandRaw({
        delete: COLLECTION,
        deletes: [{ q: { expiresAt: { $lt: { $date: new Date(now).toISOString() } } }, limit: 0 }],
      });
    }
  } catch (error) {
    report("write", error);
  }
}

function report(action: string, error: unknown) {
  console.error(`Image cache (database) ${action} failed`, error instanceof Error ? error.name : "unknown error");
}
