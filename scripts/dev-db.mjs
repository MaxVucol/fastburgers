// Local MongoDB for development (no Docker / install required).
// Starts a single-node replica set (Prisma requires one) with data persisted in ./.mongo-data.
// Usage: npm run db   →   DATABASE_URL="mongodb://127.0.0.1:27017/fastburgers?replicaSet=rs0&directConnection=true"
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const dbPath = path.join(process.cwd(), ".mongo-data");
await mkdir(dbPath, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  binary: { version: "8.0.4" },
  replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
  instanceOpts: [{ port: 27017, dbPath, ip: "127.0.0.1" }],
});

console.log(`MongoDB replica set ready: ${replSet.getUri("fastburgers")}`);
console.log("Press Ctrl+C to stop.");

const stop = async () => {
  await replSet.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
