// The database client of a Vercel Preview: it exists only when DATABASE_URL names exactly `fastburgers_preview`; on any
// other configuration every database operation (read, write, raw command, transaction, connect) is refused at the one
// place the app builds its client (lib/prisma.ts), no matter what the build checked. Production is unchanged.
// No database is reached: the address used is unreachable on purpose (127.0.0.1:1), so an operation that is not
// refused fails with a connection error, which is how these tests tell "refused" from "allowed".
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

process.env.AUTH_SECRET ??= "unit-test-secret-unit-test-secret-0123";
process.env.DATABASE_URL = "mongodb://127.0.0.1:1/fastburgers?serverSelectionTimeoutMS=300&connectTimeoutMS=300";

const { createPrismaClient, PreviewDatabaseBlockedError } = await import("@/lib/prisma");

type Env = Record<string, string | undefined>;
const DEAD = "mongodb://127.0.0.1:1";
const OPTIONS = "serverSelectionTimeoutMS=300&connectTimeoutMS=300";
const PREVIEW_URL = `${DEAD}/fastburgers_preview?${OPTIONS}`;
const PROD_URL = `${DEAD}/fastburgers?${OPTIONS}`;
const SECRET_URL = `mongodb+srv://some_user:Pw-for-tests-9@cluster.example.test/fastburgers?${OPTIONS}`;
const PREVIEW: Env = { VERCEL: "1", VERCEL_ENV: "preview" };

const refused = (action: () => unknown) => {
  try {
    action();
  } catch (error) {
    return error instanceof PreviewDatabaseBlockedError;
  }
  return false;
};

// ───────────────────────── The client factory ─────────────────────────

test("Preview on fastburgers_preview: a real client is built (and it is the checked address that it uses)", async () => {
  const client = createPrismaClient({ ...PREVIEW, DATABASE_URL: PREVIEW_URL });
  assert.equal(refused(() => client.order), false);
  assert.equal(typeof client.$connect, "function");
  // It reaches the (dead) address and fails there: a connection error, not the guard's refusal.
  await assert.rejects(client.review.findFirst(), (error: unknown) => !(error instanceof PreviewDatabaseBlockedError));
  await client.$disconnect();
});

test("Preview on any other database, or with no usable DATABASE_URL: every operation is refused", async () => {
  const bad: (string | undefined)[] = [
    PROD_URL,
    SECRET_URL,
    undefined,
    "",
    "garbage",
    `${DEAD}/fastburgers_preview2?${OPTIONS}`,
    `${DEAD}/Fastburgers_Preview?${OPTIONS}`,
    `${DEAD}/fastburgers%5Fpreview?${OPTIONS}`,
    `${DEAD}/fastburgers_preview/?${OPTIONS}`,
    `${DEAD}/?authSource=fastburgers_preview`,
    `${DEAD}/fastburgers?x=/fastburgers_preview`,
  ];
  for (const DATABASE_URL of bad) {
    const client = createPrismaClient({ ...PREVIEW, DATABASE_URL });
    for (const access of [
      () => client.order,
      () => client.user,
      () => client.order.create,
      () => client.$transaction,
      () => client.$runCommandRaw,
      () => client.$extends,
      () => (client as unknown as Record<string, unknown>).anythingElse, // any other member is refused too
      () => client.$connect,
      () => client.$on,
    ]) {
      assert.equal(refused(access), true, `not refused for ${String(DATABASE_URL).replace(/\/\/.*@/, "//…@")}`);
    }
    // Tooling that probes an object does not trip it, and shutdown is harmless.
    assert.equal(await Promise.resolve(client as unknown), client);
    assert.equal(JSON.stringify({ client }), '{"client":{}}');
    await client.$disconnect();
  }
});

test("the refusal holds no part of the address, user or password", () => {
  const client = createPrismaClient({ ...PREVIEW, DATABASE_URL: SECRET_URL });
  let thrown: unknown;
  try {
    client.order.findMany();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof PreviewDatabaseBlockedError);
  const text = `${thrown.name} ${thrown.message} ${thrown.stack}`;
  assert.doesNotMatch(text, /Pw-for-tests|some_user|example\.test|mongodb|127\.0\.0\.1/);
});

test("Production and local development are not touched by the Preview rule", async () => {
  for (const env of [
    { VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: PROD_URL },
    { VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: SECRET_URL },
    { VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: PREVIEW_URL },
    { VERCEL_ENV: undefined, DATABASE_URL: PROD_URL }, // local
    { VERCEL_ENV: "development", DATABASE_URL: PROD_URL },
  ] as Env[]) {
    const client = createPrismaClient(env);
    assert.equal(refused(() => client.order), false, JSON.stringify(Object.keys(env)));
    assert.equal(refused(() => client.$runCommandRaw), false);
    await client.$disconnect();
  }
});

// ───────────────────────── Real operations, in a separate process ─────────────────────────

type Result = { name: string; refused: boolean; error: string | null };

/** Runs the app's real service operations in a fresh process with exactly this environment. */
function runOperations(env: Env): Result[] {
  const base: Env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...env };
  const result = spawnSync(
    process.execPath,
    ["--experimental-transform-types", "--no-warnings", "--import", "./tests/setup/register.mjs", "tests/setup/preview-writes.mjs"],
    { cwd: process.cwd(), env: base as unknown as NodeJS.ProcessEnv, encoding: "utf8", timeout: 120_000 },
  );
  const line = `${result.stdout}`.split("\n").find((l) => l.startsWith("RESULT "));
  assert.ok(line, `no result from the child process (exit ${result.status}): ${String(result.stderr).slice(-300)}`);
  return JSON.parse(line.slice("RESULT ".length)) as Result[];
}

test("a Preview on the production database cannot be bypassed by calling the services or the client directly", () => {
  for (const DATABASE_URL of [PROD_URL, SECRET_URL, undefined]) {
    const results = runOperations({ ...PREVIEW, ...(DATABASE_URL ? { DATABASE_URL } : {}) });
    assert.equal(results.length, 9);
    for (const r of results) {
      assert.equal(r.refused, true, `${r.name} was not refused (${r.error})`);
      assert.equal(r.error, "PreviewDatabaseBlockedError", r.name);
    }
  }
});

test("a client parked on globalThis does not let a misconfigured Preview through", () => {
  const results = runOperations({ ...PREVIEW, DATABASE_URL: PROD_URL, PARK_GLOBAL_CLIENT: "1" });
  assert.equal(results.length, 9);
  for (const r of results) assert.equal(r.error, "PreviewDatabaseBlockedError", r.name);
});

test("a Preview on fastburgers_preview, and Production, are not refused (the operations reach the dead address and fail there)", () => {
  for (const env of [
    { ...PREVIEW, DATABASE_URL: PREVIEW_URL },
    { VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: PROD_URL },
    { DATABASE_URL: PROD_URL }, // local development
  ] as Env[]) {
    const results = runOperations(env);
    for (const r of results) assert.equal(r.refused, false, `${r.name} was refused: ${r.error}`);
  }
});
