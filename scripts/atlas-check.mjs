// Read-only check of the Atlas connection defined in .env.atlas.
// Usage: node scripts/atlas-check.mjs
// Prints only non-secret structure (host, database, flags) — never the user, password or full URL.
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const FILE = ".env.atlas";
if (!existsSync(FILE)) {
  console.error(`✖ ${FILE} not found in the project root.`);
  process.exit(1);
}
// Parse the file directly: @prisma/client loads the local .env on import, so relying on
// process.env would silently pick up the local database instead of Atlas.
const raw = (parseEnv(readFileSync(FILE, "utf8")).DATABASE_URL ?? "").trim();
let secrets = [];
const redact = (text) => secrets.reduce((t, s) => (s ? t.split(s).join("***") : t), String(text));

function fail(message) {
  console.error(`✖ ${redact(message)}`);
  process.exit(1);
}

if (!raw) fail("DATABASE_URL is empty in .env.atlas.");
if (/<[^>]*>/.test(raw)) fail("DATABASE_URL still contains a placeholder in angle brackets (e.g. <PASSWORD> or <db_password>).");

let url;
try {
  url = new URL(raw);
} catch {
  fail("DATABASE_URL is not a valid URL. Check quotes and URL-encode special characters in the password.");
}
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
secrets = [raw, url.password, password, url.username, user].filter((s) => s && s.length >= 3);

const db = url.pathname.replace(/^\//, "");
const report = {
  protocol: url.protocol,
  host: url.hostname,
  database: db || "(missing)",
  userPresent: Boolean(user),
  passwordPresent: Boolean(password),
  options: [...url.searchParams.keys()].join(", ") || "(none)",
};
console.log("Connection string structure:");
for (const [k, v] of Object.entries(report)) console.log(`  ${k.padEnd(16)} ${v}`);

if (url.protocol !== "mongodb+srv:") fail("Expected a mongodb+srv:// Atlas connection string.");
if (!user || !password) fail("User or password is missing in the connection string.");
if (db !== "fastburgers") fail(`Database name must be "fastburgers" (right after .mongodb.net/), found "${db || "nothing"}".`);

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasourceUrl: raw, log: [] });
try {
  const ping = await prisma.$runCommandRaw({ ping: 1 });
  console.log(`✓ Connected to Atlas (ping ok=${ping.ok})`);

  const listing = await prisma.$runCommandRaw({ listCollections: 1, nameOnly: true });
  const names = (listing.cursor?.firstBatch ?? []).map((c) => c.name).sort();
  if (names.length === 0) {
    console.log("✓ Database \"fastburgers\" is empty (no collections yet).");
  } else {
    console.log(`Collections in "fastburgers": ${names.length}`);
    for (const name of names) {
      const res = await prisma.$runCommandRaw({ count: name });
      console.log(`  ${name.padEnd(16)} ${res.n} documents`);
    }
  }
} catch (error) {
  const msg = redact(error instanceof Error ? error.message : error);
  if (/auth|SCRAM|credential/i.test(msg)) fail(`Authentication failed — check the user and password (and URL-encoding).\n  ${msg.split("\n").slice(-2).join(" ")}`);
  if (/timeout|ENOTFOUND|querySrv|Server selection/i.test(msg)) fail(`Cannot reach the cluster — check the host and Atlas Network Access.\n  ${msg.split("\n").slice(-2).join(" ")}`);
  if (/not authorized/i.test(msg)) fail(`Connected, but the user lacks permissions on "fastburgers" (needs readWrite).\n  ${msg.split("\n").slice(-2).join(" ")}`);
  fail(msg);
} finally {
  await prisma.$disconnect();
}
