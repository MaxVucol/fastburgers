// Prepares the separate Preview database (`fastburgers_preview`) from .env.preview, and refuses to touch anything else.
//
//   node scripts/preview-db.mjs check                      read-only: structure of .env.preview, then ping + collection counts
//   node scripts/preview-db.mjs push --confirm-preview     prisma db push (creates the collections and indexes)
//   node scripts/preview-db.mjs seed --confirm-preview     the demo seed (fictional catalogue, reviews, locations, demo orders)
//
// .env.preview holds DATABASE_URL (the Preview-only Atlas user), ADMIN_EMAIL and ADMIN_PASSWORD (a Preview-only
// administrator; the seed insists on a strong password for a remote database). The file is ignored by Git (.env*).
//
// Before anything runs (and before any network access) these must hold, otherwise nothing happens:
//   - DATABASE_URL names exactly `fastburgers_preview` (lib/preview-guard.mjs, the same rule as the Preview build);
//   - it is a mongodb+srv:// Atlas address with a user and a password, and no placeholder like <password>;
//   - it is not the production database: .env.atlas (if present) must name another database AND another Atlas user;
//   - writing commands need --confirm-preview.
// The seed never gets SEED_ALLOW_RESET, so it refuses a database that already holds data. Connection strings, users
// and passwords are never printed (output is masked).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { checkPreviewDatabase, databaseNameOf } from "../lib/preview-guard.mjs";

const PREVIEW_FILE = ".env.preview";
const PRODUCTION_FILE = ".env.atlas";

export class PreviewDbError extends Error {}

/** `user`, `password` and `host` of an Atlas address (raw, not decoded), or null when it does not parse. */
function parts(url) {
  const match = /^mongodb(?:\+srv)?:\/\/([^/?#@]*)@([^/?#]*)\//i.exec(url);
  if (!match) return null;
  const colon = match[1].indexOf(":");
  return colon === -1 ? { user: match[1], password: "", host: match[2] } : { user: match[1].slice(0, colon), password: match[1].slice(colon + 1), host: match[2] };
}

/**
 * Validates the contents of .env.preview (a parsed object) against the rules above. Returns what is safe to show
 * and the strings to mask. Throws PreviewDbError with a reason that holds no part of the address.
 * `production` is the parsed .env.atlas, or null when the file does not exist.
 * @param {Record<string, string | undefined>} preview
 * @param {Record<string, string | undefined> | null} [production]
 */
export function inspectPreviewEnv(preview, production = null) {
  const url = preview.DATABASE_URL ?? "";
  if (!url) throw new PreviewDbError(`DATABASE_URL is missing in ${PREVIEW_FILE}.`);
  if (/<[^>]*>/.test(url)) throw new PreviewDbError("DATABASE_URL still contains a placeholder in angle brackets (e.g. <password>).");
  const check = checkPreviewDatabase({ DATABASE_URL: url });
  if (!check.ok) throw new PreviewDbError(`DATABASE_URL does not point at the Preview database: ${check.reason}.`);
  if (!/^mongodb\+srv:\/\//i.test(url)) throw new PreviewDbError("DATABASE_URL must be a mongodb+srv:// Atlas address.");
  const mine = parts(url);
  if (!mine || !mine.user || !mine.password) throw new PreviewDbError("DATABASE_URL needs a user and a password (URL-encode special characters in the password).");

  if (production?.DATABASE_URL) {
    const prod = parts(production.DATABASE_URL);
    const prodName = databaseNameOf(production.DATABASE_URL);
    if (prodName === "fastburgers_preview") throw new PreviewDbError(`${PRODUCTION_FILE} also names the Preview database: it must be the production one.`);
    if (prod && prod.user.toLowerCase() === mine.user.toLowerCase()) {
      throw new PreviewDbError(`The Preview must have its own Atlas user: it is the same user as in ${PRODUCTION_FILE}.`);
    }
    if (prod && prod.password && prod.password === mine.password) {
      throw new PreviewDbError(`The Preview password equals the one in ${PRODUCTION_FILE}: give the Preview user its own password.`);
    }
  }

  const secrets = [url, mine.user, mine.password, safeDecode(mine.user), safeDecode(mine.password), preview.ADMIN_PASSWORD ?? ""].filter((s) => s && s.length >= 3);
  return {
    host: mine.host,
    database: databaseNameOf(url),
    adminEmail: (preview.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    adminPasswordPresent: Boolean(preview.ADMIN_PASSWORD),
    secrets,
  };
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const maskWith = (secrets) => (text) =>
  secrets.reduce((out, s) => out.split(s).join("***"), String(text)).replace(/mongodb(\+srv)?:\/\/\S+/g, "<connection string>");

function readEnvFile(file) {
  return existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : null;
}

function describe(info) {
  console.log("Preview connection (secrets are never printed):");
  console.log(`  host              ${info.host}`);
  console.log(`  database          ${info.database}`);
  console.log(`  admin e-mail      ${info.adminEmail || "(not set)"}`);
  console.log(`  admin password    ${info.adminPasswordPresent ? "set" : "(not set)"}`);
}

async function main(argv) {
  const [command, ...flags] = argv;
  if (!["check", "push", "seed"].includes(command)) {
    console.error("Usage: node scripts/preview-db.mjs check | push --confirm-preview | seed --confirm-preview");
    return 2;
  }
  const preview = readEnvFile(PREVIEW_FILE);
  if (!preview) {
    console.error(`✖ ${PREVIEW_FILE} not found in the project root (see docs/SECURITY-RUNBOOK.md).`);
    return 1;
  }
  let info;
  try {
    info = inspectPreviewEnv(preview, readEnvFile(PRODUCTION_FILE));
  } catch (error) {
    if (error instanceof PreviewDbError) {
      console.error(`✖ ${error.message} Nothing was run.`);
      return 1;
    }
    throw error;
  }
  const mask = maskWith(info.secrets);
  describe(info);

  if (command !== "check" && !flags.includes("--confirm-preview")) {
    console.error(`✖ "${command}" changes the database. Add --confirm-preview to run it on "${info.database}".`);
    return 1;
  }

  // Everything the child needs comes from this file only: the local .env and the shell's DATABASE_URL never reach it.
  const env = { ...process.env, DATABASE_URL: preview.DATABASE_URL };
  delete env.SEED_ALLOW_RESET;
  if (command === "seed") {
    env.ADMIN_EMAIL = preview.ADMIN_EMAIL ?? "";
    env.ADMIN_PASSWORD = preview.ADMIN_PASSWORD ?? "";
    env.SEED_DEMO_ORDERS = preview.SEED_DEMO_ORDERS ?? "true";
  }

  if (command === "check") return await readOnlyCheck(preview.DATABASE_URL, mask);

  const args =
    command === "push"
      ? ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"]
      : ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"];
  const result = spawnSync(process.execPath, args, { env, encoding: "utf8", maxBuffer: 1 << 26, timeout: 300_000 });
  const lines = `${result.stdout ?? ""}${result.stderr ?? ""}`.split("\n").map(mask).filter((l) => l.trim());
  console.log(lines.slice(-25).join("\n"));
  if (result.status !== 0) {
    console.error(`✖ ${command} failed (exit ${result.status ?? "stopped"}${result.signal ? `, ${result.signal}` : ""}).`);
    return 1;
  }
  console.log(`✓ ${command} finished on "${info.database}".`);
  return 0;
}

/** ping + collection names and counts: reads only, and only from the Preview database. */
async function readOnlyCheck(url, mask) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: url, log: [] });
  try {
    const ping = await prisma.$runCommandRaw({ ping: 1 });
    console.log(`✓ Connected (ping ok=${ping.ok})`);
    const listing = await prisma.$runCommandRaw({ listCollections: 1, nameOnly: true });
    const names = (listing.cursor?.firstBatch ?? []).map((c) => c.name).sort();
    if (names.length === 0) console.log('✓ The database is empty (no collections yet): ready for "push" and "seed".');
    for (const name of names) {
      const res = await prisma.$runCommandRaw({ count: name });
      console.log(`  ${String(name).padEnd(18)} ${res.n} documents`);
    }
    return 0;
  } catch (error) {
    console.error(`✖ Could not read the database: ${mask(error instanceof Error ? error.message : error).split("\n").slice(0, 4).join(" ")}`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main(process.argv.slice(2)));
}
