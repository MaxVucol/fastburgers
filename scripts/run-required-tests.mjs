// Runs test files that MUST run, and fails when they did not.
//
//   node scripts/run-required-tests.mjs [--db] [--integration] [files...]
//
//   --db           start / prepare the test database first (see scripts/test-db.mjs) and give it to the
//                  tests as TEST_DATABASE_URL
//   --integration  add every tests/*.integration.test.ts
//
// `node --test` reports a test that was skipped as a success. For files that guard security or data
// (the integration tests need a database, the build-output checks need a build) that is a false green, so
// this runner fails when: any test fails, any is skipped / marked todo, nothing ran, or fewer tests ran than
// the files declare. Output is filtered and never contains connection strings.
import { readdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { provisionTestDatabase } from "./test-db.mjs";

const args = process.argv.slice(2);
const wantsDb = args.includes("--db");
const files = args.filter((a) => !a.startsWith("--"));
if (args.includes("--integration")) {
  files.push(...readdirSync("tests").filter((f) => f.endsWith(".integration.test.ts")).map((f) => `tests/${f}`));
}
if (files.length === 0) {
  console.error("No test files given.");
  process.exit(2);
}

/** Tests the files declare (one `test(` / `it(` per line start); the run must execute at least this many. */
const declared = files.reduce((sum, file) => sum + (readFileSync(file, "utf8").match(/^\s*(?:test|it)(?:\.\w+)?\(/gm) ?? []).length, 0);

let db = null;
const secrets = [];
if (wantsDb) {
  db = await provisionTestDatabase();
  secrets.push(db.url);
  console.log(`Test database: ${db.source === "ephemeral" ? "ephemeral MongoDB started for this run" : "the TEST_DATABASE_URL secret"} (not printed)`);
}

const mask = (text) => secrets.reduce((out, secret) => out.split(secret).join("<test-db>"), text).replace(/mongodb(\+srv)?:\/\/\S+/g, "<connection string>");

const child = spawn(
  process.execPath,
  ["--experimental-transform-types", "--no-warnings", "--import", "./tests/setup/register.mjs", "--test", "--test-concurrency=1", "--test-reporter=spec", ...files],
  { env: { ...process.env, ...(db ? { TEST_DATABASE_URL: db.url } : {}) }, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
child.stdout.on("data", (chunk) => (output += chunk));
child.stderr.on("data", (chunk) => (output += chunk));
const exitCode = await new Promise((resolve) => child.on("close", resolve));
if (db) await db.stop();

const clean = mask(output);
const summary = (name) => Number(clean.match(new RegExp(`^ℹ ${name} (\\d+)`, "m"))?.[1] ?? NaN);
const ran = summary("tests");
const failed = summary("fail");
const skipped = summary("skipped");
const todo = summary("todo");

// What is worth reading in a log: each test line, failures with their message, and the totals.
console.log(clean.split("\n").filter((line) => /^\s*(✔|✖|▶)|^ℹ (tests|suites|pass|fail|skipped|todo|duration_ms)|AssertionError|Error:|expected|actual/.test(line)).join("\n"));

const problems = [];
if (exitCode !== 0) problems.push(`the test process exited with code ${exitCode}`);
if (!(ran > 0)) problems.push("no test ran");
if (ran < declared) problems.push(`only ${ran} tests ran, the files declare ${declared}`);
if (failed > 0) problems.push(`${failed} failed`);
if (skipped > 0) problems.push(`${skipped} skipped (required tests must not be skipped: is TEST_DATABASE_URL / the build missing?)`);
if (todo > 0) problems.push(`${todo} marked todo`);

if (problems.length > 0) {
  console.error(`\nREQUIRED TESTS NOT SATISFIED: ${problems.join("; ")}.`);
  process.exit(1);
}
console.log(`\nRequired tests OK: ${ran} of ${declared} declared ran, 0 skipped, 0 failed.`);
