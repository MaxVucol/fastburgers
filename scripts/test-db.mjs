// A MongoDB for the tests that is never the production database.
//
//  - TEST_DATABASE_URL set (a CI secret or your own *test* database): it is used as given, after
//    checks (the database name must contain "test", and it must not be DATABASE_URL).
//  - Otherwise an ephemeral single-node replica set is started on this machine (mongodb-memory-server,
//    the same tool as `npm run db`), used, and thrown away. Nothing outside the machine is touched.
//
// The schema is pushed and the demo data is seeded into that database (the seed resets its catalogue and
// orders: harmless here, and refused anywhere the name does not say "test"). Connection strings and
// passwords are never printed.
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

export class UnsafeTestDatabaseError extends Error {}

/** Throws unless `url` is clearly a test database and not the configured production one. */
export function assertSafeTestUrl(url, productionUrl = process.env.DATABASE_URL) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeTestDatabaseError("TEST_DATABASE_URL is not a valid connection string.");
  }
  if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
    throw new UnsafeTestDatabaseError("TEST_DATABASE_URL must be a mongodb:// or mongodb+srv:// address.");
  }
  const name = parsed.pathname.replace(/^\//, "");
  if (!/test/i.test(name)) {
    throw new UnsafeTestDatabaseError('The test database name must contain "test" (e.g. fastburgers_test). Refusing to run.');
  }
  if (productionUrl) {
    try {
      const prod = new URL(productionUrl);
      if (prod.hostname === parsed.hostname && prod.pathname === parsed.pathname) {
        throw new UnsafeTestDatabaseError("TEST_DATABASE_URL points at the same database as DATABASE_URL. Refusing to run.");
      }
    } catch (error) {
      if (error instanceof UnsafeTestDatabaseError) throw error;
    }
  }
}

function run(command, args, env, label) {
  const result = spawnSync(command, args, { env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 1 << 26, timeout: 240_000 });
  if (result.status !== 0) {
    if (result.signal) throw new Error(`${label} did not finish within 4 minutes and was stopped.`);
    const text = `${result.stdout ?? ""}${result.stderr ?? ""}`.split("\n").slice(-12).join("\n");
    // A failure message may quote the address: cut anything that looks like a connection string.
    throw new Error(`${label} failed (exit ${result.status}).\n${text.replace(/mongodb(\+srv)?:\/\/\S+/g, "<connection string>")}`);
  }
}

/**
 * Creates the schema's unique indexes (and so the collections) with plain MongoDB commands, read from Prisma's
 * data model. Used for the throw-away database: `prisma db push` hangs against a freshly started
 * mongodb-memory-server replica set (observed on Windows and on GitHub's Linux runners), although the same
 * commands are accepted. Only unique indexes matter to the tests; plain (non-unique) indexes only speed queries up.
 */
export async function createUniqueIndexes(url) {
  assertSafeTestUrl(url);
  const { PrismaClient, Prisma } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    for (const model of Prisma.dmmf.datamodel.models) {
      const collection = model.dbName ?? model.name;
      const column = (name) => model.fields.find((field) => field.name === name)?.dbName ?? name;
      const groups = [
        ...model.fields.filter((field) => field.isUnique && !field.isId).map((field) => [field.name]),
        ...(model.uniqueFields ?? []),
      ];
      const indexes = groups.map((names) => ({
        name: `${collection}_${names.map(column).join("_")}_key`,
        key: Object.fromEntries(names.map((name) => [column(name), 1])),
        unique: true,
      }));
      if (indexes.length === 0) await prisma.$runCommandRaw({ create: collection }).catch(() => {});
      else await prisma.$runCommandRaw({ createIndexes: collection, indexes });
    }
  } finally {
    await prisma.$disconnect();
  }
}

/** Pushes the Prisma schema (collections, unique indexes) and seeds the demo catalogue. */
export async function prepareTestDatabase(url, { ephemeral = false } = {}) {
  assertSafeTestUrl(url);
  const env = {
    DATABASE_URL: url,
    // Only the seed reads these; the values live for this process alone.
    ADMIN_EMAIL: "ci-admin@example.com",
    ADMIN_PASSWORD: `Aa1-${randomBytes(18).toString("base64url")}`,
  };
  if (ephemeral) await createUniqueIndexes(url);
  else run(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"], env, "prisma db push");
  try {
    run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], env, "database seed");
  } catch (error) {
    // The seed refuses to overwrite a database that already holds a catalogue: for a test database that
    // is already set up, that is exactly what we want (nothing is deleted).
    if (!(error instanceof Error) || !/not empty/i.test(error.message)) throw error;
  }
}

/**
 * Returns `{ url, source, stop }`. `source` is "TEST_DATABASE_URL" or "ephemeral"; call `stop()` when done.
 */
export async function provisionTestDatabase({ prepare = true } = {}) {
  const provided = process.env.TEST_DATABASE_URL?.trim();
  if (provided) {
    assertSafeTestUrl(provided);
    if (prepare) await prepareTestDatabase(provided);
    return { url: provided, source: "TEST_DATABASE_URL", stop: async () => {} };
  }
  const replSet = await MongoMemoryReplSet.create({
    binary: { version: "8.0.4" },
    replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
  });
  const uri = new URL(replSet.getUri("fastburgers_test"));
  uri.searchParams.set("directConnection", "true");
  const url = uri.toString();
  try {
    if (prepare) await prepareTestDatabase(url, { ephemeral: true });
  } catch (error) {
    await replSet.stop();
    throw error;
  }
  return { url, source: "ephemeral", stop: async () => void (await replSet.stop()) };
}
