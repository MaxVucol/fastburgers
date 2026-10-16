// CI: production build against a throw-away test database, then the build-output security checks.
//
//   node scripts/ci-build.mjs
//
// The build reads the menu from MongoDB to prerender pages, so it needs a database with a catalogue. This
// provisions the same isolated test database as the integration tests (scripts/test-db.mjs: never the
// production DATABASE_URL), builds with throw-away settings, and then runs tests/security.test.ts, which
// scans the build for secrets and source maps and MUST run (see scripts/run-required-tests.mjs).
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { provisionTestDatabase } from "./test-db.mjs";

const db = await provisionTestDatabase();
let status = 1;
try {
  const env = {
    ...process.env,
    DATABASE_URL: db.url,
    AUTH_SECRET: randomBytes(36).toString("base64url"),
    NEXT_PUBLIC_SITE_URL: "https://ci.example.test",
  };
  // Never let a real storage token reach a CI build.
  delete env.BLOB_READ_WRITE_TOKEN;
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npm, ["run", "build"], { env, stdio: "inherit", shell: process.platform === "win32" });
  if (build.status !== 0) throw new Error(`production build failed (exit ${build.status})`);
  const checks = spawnSync(process.execPath, ["scripts/run-required-tests.mjs", "tests/security.test.ts"], { env, stdio: "inherit" });
  status = checks.status ?? 1;
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error).replace(/mongodb(\+srv)?:\/\/\S+/g, "<connection string>"));
} finally {
  await db.stop();
}
process.exit(status);
