// Runs before `next build`. Fails fast with an actionable message when required
// environment variables are missing or point to the wrong place.
// Never prints secret values — only variable names and what is wrong with them.
import { existsSync } from "node:fs";

// Locally, Next.js loads .env itself, but this script runs before Next does.
if (existsSync(".env") && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env"); // does not override variables already set
  } catch {
    // ignore malformed .env here; Next.js will report it
  }
}

const onVercel = Boolean(process.env.VERCEL);
const errors = [];
const warnings = [];

const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
if (!dbUrl) {
  errors.push(
    "DATABASE_URL is not set. The build reads the menu from MongoDB to prerender pages.\n" +
      "    On Vercel: Project → Settings → Environment Variables → add DATABASE_URL\n" +
      "    for Production AND Preview, e.g. mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/fastburgers?retryWrites=true&w=majority",
  );
} else {
  let parsed = null;
  try {
    parsed = new URL(dbUrl);
  } catch {
    errors.push("DATABASE_URL is not a valid connection string (check that special characters in the password are URL-encoded).");
  }
  if (parsed) {
    if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
      errors.push("DATABASE_URL must start with mongodb+srv:// (Atlas) or mongodb://.");
    }
    const dbName = parsed.pathname.replace(/^\//, "");
    if (!dbName) {
      errors.push('DATABASE_URL must include the database name after the host, e.g. "...mongodb.net/fastburgers?...".');
    }
    const host = parsed.hostname;
    if (onVercel && (host === "localhost" || host === "127.0.0.1" || host === "::1")) {
      errors.push("DATABASE_URL points to localhost, which Vercel cannot reach. Use a hosted MongoDB (e.g. MongoDB Atlas).");
    }
  }
}

const secret = process.env.AUTH_SECRET ?? "";
if (secret.length < 32) {
  (onVercel ? errors : warnings).push(
    "AUTH_SECRET must be set and at least 32 characters long (admin login cookies are signed with it).",
  );
}

if (onVercel && !process.env.BLOB_READ_WRITE_TOKEN) {
  warnings.push(
    "BLOB_READ_WRITE_TOKEN is not set: image uploads in /admin will be rejected. Connect a Vercel Blob store to the project.",
  );
}

// Warnings only: they never block a deploy.
if (onVercel && process.env.VERCEL_ENV === "production" && process.env.ORDER_MODE?.trim() !== "live") {
  warnings.push('ORDER_MODE is not "live": orders on this deployment are tagged as demo orders.');
}
if (onVercel && process.env.VERCEL_ENV === "preview" && process.env.ORDER_MODE?.trim() === "live") {
  warnings.push('ORDER_MODE is "live" on a Preview deployment: preview orders would look like real ones. Give Preview its own database.');
}
if (onVercel && !process.env.NEXT_PUBLIC_SITE_URL) {
  warnings.push("NEXT_PUBLIC_SITE_URL is not set: canonical URLs and the sitemap will use the Vercel production domain.");
}

for (const w of warnings) console.warn(`⚠ env: ${w}`);
if (errors.length > 0) {
  console.error("\n✖ Environment check failed:\n");
  for (const e of errors) console.error(`  • ${e}\n`);
  process.exit(1);
}
console.log("✓ Environment check passed");
