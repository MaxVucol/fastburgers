// Security regression checks that need no database: HTTP headers, the trusted image host, the order
// look-up limiter, the "every admin action checks the administrator" rule and a scan of the build
// output for secrets and source maps (skipped when there is no build).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

process.env.AUTH_SECRET ??= "unit-test-secret-unit-test-secret-0123";

const { blobHostname, ENFORCED_CSP, fullCsp, securityHeaders } = await import("@/lib/security-headers");
const { consume, createMemoryRateLimitStore, RATE_LIMITS } = await import("@/lib/rate-limit");

const root = process.cwd();
// Made-up token shapes, assembled at run time so that no token-looking literal sits in the source (secret scanners).
const fakeToken = (storeId: string) => ["vercel", "blob", "rw", storeId, "notarealsecret"].join("_");

test("image host: the store id comes from the Blob token; anything unusable falls back to every store", () => {
  assert.equal(blobHostname({ BLOB_READ_WRITE_TOKEN: fakeToken("AbC123xyz789") }), "abc123xyz789.public.blob.vercel-storage.com");
  assert.equal(blobHostname({}), "*.public.blob.vercel-storage.com");
  assert.equal(blobHostname({ BLOB_READ_WRITE_TOKEN: "garbage" }), "*.public.blob.vercel-storage.com");
  // A store id that is not a plain host label never ends up in a host name or a CSP.
  assert.equal(blobHostname({ BLOB_READ_WRITE_TOKEN: fakeToken("evil.example.com") }), "*.public.blob.vercel-storage.com");
});

test("security headers: framing, sniffing, referrer, permissions and the enforced CSP are set for every path", () => {
  const rule = securityHeaders("store123abc.public.blob.vercel-storage.com");
  assert.equal(rule.source, "/:path*");
  const value = (key: string) => rule.headers.find((h) => h.key === key)?.value;
  assert.equal(value("X-Content-Type-Options"), "nosniff");
  assert.equal(value("X-Frame-Options"), "DENY");
  assert.match(value("Referrer-Policy") ?? "", /strict-origin/);
  assert.match(value("Permissions-Policy") ?? "", /camera=\(\)/);
  assert.equal(value("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(value("Content-Security-Policy"), ENFORCED_CSP);
  assert.match(ENFORCED_CSP, /frame-ancestors 'none'/);
  assert.match(ENFORCED_CSP, /object-src 'none'/);
});

test("full CSP (report-only): same-origin by default, no eval, images only from this site and its Blob store", () => {
  const csp = fullCsp("store123abc.public.blob.vercel-storage.com");
  assert.match(csp, /default-src 'self'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /\*\.public\.blob/);
  assert.match(csp, /img-src 'self' data: blob: https:\/\/store123abc\.public\.blob\.vercel-storage\.com/);
  assert.match(csp, /connect-src 'self'(;|$)/);
});

test("order look-up: the 16th try from one address inside the window is refused", async () => {
  const store = createMemoryRateLimitStore();
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  for (let i = 0; i < RATE_LIMITS.lookupIp.limit; i++) {
    assert.deepEqual(await consume(RATE_LIMITS.lookupIp, "203.0.113.7", store, now + i), { ok: true });
  }
  assert.equal((await consume(RATE_LIMITS.lookupIp, "203.0.113.7", store, now + 100)).ok, false);
  assert.deepEqual(await consume(RATE_LIMITS.lookupIp, "203.0.113.8", store, now + 100), { ok: true });
});

// ───────────────────────── Authorization guards (static) ─────────────────────────

const ADMIN_ACTION_FILES = ["categories", "market", "orders", "products", "users"].map((n) => path.join(root, "actions", "admin", `${n}.ts`));

test("every exported admin Server Action checks the administrator before it does anything else", () => {
  for (const file of ADMIN_ACTION_FILES) {
    const source = readFileSync(file, "utf8");
    const bodies = source.split(/^export async function /m).slice(1);
    assert.ok(bodies.length > 0, `${path.basename(file)} exports no actions?`);
    for (const body of bodies) {
      const name = body.slice(0, body.indexOf("("));
      const open = body.indexOf("{\n");
      const before = body.slice(open, body.indexOf("requireAdmin()")).replace(/(?:const \w+ = )?await\s*$/, "");
      assert.ok(body.includes("requireAdmin()"), `${path.basename(file)}: ${name} does not call requireAdmin()`);
      // Only declarations may precede the check (no database access, no reads of the request).
      assert.doesNotMatch(before, /prisma\.|formData\.|await /, `${path.basename(file)}: ${name} does work before requireAdmin()`);
    }
  }
});

test("admin routes and the proxy gate: the CSV export checks the administrator itself, the proxy sends others to the login", () => {
  assert.match(readFileSync(path.join(root, "app", "admin", "market-export", "route.ts"), "utf8"), /getAdmin\(\)[\s\S]*403/);
  const proxy = readFileSync(path.join(root, "proxy.ts"), "utf8");
  assert.match(proxy, /role === "ADMIN"/);
  assert.match(proxy, /\/admin\/login/);
});

test("the session cookie is httpOnly, SameSite and Secure in production; the role is read from the database", () => {
  const session = readFileSync(path.join(root, "lib", "auth", "session.ts"), "utf8");
  assert.match(session, /httpOnly: true/);
  assert.match(session, /sameSite: "lax"/);
  assert.match(session, /secure: process\.env\.NODE_ENV === "production"/);
  assert.match(session, /role always comes from the database/);
});

// ───────────────────────── Build output (skipped without a build) ─────────────────────────

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else yield full;
  }
}

const SECRET_PATTERNS: [string, RegExp][] = [
  ["MongoDB connection string with credentials", /mongodb(?:\+srv)?:\/\/[^\s"'<>:@]+:[^\s"'<>@]+@/],
  ["Vercel Blob token", /vercel_blob_rw_[A-Za-z0-9]+_[A-Za-z0-9]+/],
  ["Telegram bot token", /\b\d{8,12}:[A-Za-z0-9_-]{34,36}\b/],
  ["Google OAuth client secret", /GOCSPX-[A-Za-z0-9_-]{20,}/],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];

const build = path.join(root, ".next");
const hasBuild = existsSync(path.join(build, "static")) && existsSync(path.join(build, "server", "app"));

test("build output: no secrets in the browser bundles or the prerendered pages", { skip: !hasBuild && "no production build (.next)" }, () => {
  for (const dir of [path.join(build, "static"), path.join(build, "server", "app")]) {
    for (const file of files(dir)) {
      if (!/\.(js|css|html|rsc|json|txt|body|meta)$/.test(file) || statSync(file).size > 8_000_000) continue;
      const text = readFileSync(file, "utf8");
      for (const [label, pattern] of SECRET_PATTERNS) {
        assert.doesNotMatch(text, pattern, `${label} found in ${path.relative(root, file)}`);
      }
    }
  }
});

test("build output: no source maps are published with the browser bundles", { skip: !hasBuild && "no production build (.next)" }, () => {
  const maps = [...files(path.join(build, "static"))].filter((f) => f.endsWith(".map"));
  assert.deepEqual(maps.map((f) => path.relative(root, f)), []);
});
