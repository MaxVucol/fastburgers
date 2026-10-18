// Runs before `next build`. Fails fast with an actionable message when required
// environment variables are missing or point to the wrong place.
// Never prints secret values — only variable names and what is wrong with them.
import { existsSync } from "node:fs";
import { checkPreviewDatabase, isPreviewDeployment, PREVIEW_DATABASE_NAME } from "../lib/preview-guard.mjs";

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

// A Preview deployment must run on its own database. Reasons only, never the connection string.
if (isPreviewDeployment()) {
  const preview = checkPreviewDatabase();
  if (!preview.ok) {
    errors.push(
      `This is a Preview deployment, and DATABASE_URL does not point at the separate Preview database (${preview.reason}).\n` +
        `    Preview must use a database named exactly "${PREVIEW_DATABASE_NAME}" with its own Atlas user, so that test orders\n` +
        `    never reach real data. On Vercel: Settings → Environment Variables → give DATABASE_URL a Preview-only value\n` +
        "    and remove Preview from the Production one. See docs/SECURITY-RUNBOOK.md.",
    );
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
if (isPreviewDeployment() && process.env.ORDER_MODE?.trim() === "live") {
  warnings.push('ORDER_MODE is "live" on a Preview deployment: it is ignored there (Preview orders are always demo orders). Remove it from Preview.');
}
if (isPreviewDeployment()) {
  for (const name of ["BLOB_READ_WRITE_TOKEN", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "GMAIL_APP_PASSWORD", "RESEND_API_KEY"]) {
    if (process.env[name]?.trim()) warnings.push(`${name} is set on a Preview deployment: it is ignored there (Telegram, e-mail and Blob writes are off in Preview). Remove it from Preview.`);
  }
}
if (onVercel && !process.env.NEXT_PUBLIC_SITE_URL) {
  warnings.push("NEXT_PUBLIC_SITE_URL is not set: canonical URLs and the sitemap will use the Vercel production domain.");
}

// Optional integrations: warn about half-done setups (names only, never values).
const filled = (name) => Boolean(process.env[name]?.trim());
if (filled("GOOGLE_CLIENT_ID") !== filled("GOOGLE_CLIENT_SECRET")) {
  warnings.push("Only one of GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is set: “Continue with Google” stays hidden until both are.");
}
const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() ?? "";
if (provider && provider !== "gmail" && provider !== "resend") {
  warnings.push('EMAIL_PROVIDER must be "gmail" or "resend": e-mail stays off.');
}
if (provider === "gmail" && (!filled("GMAIL_USER") || !filled("GMAIL_APP_PASSWORD"))) {
  warnings.push("EMAIL_PROVIDER is gmail but GMAIL_USER / GMAIL_APP_PASSWORD are not both set: e-mail stays off.");
} else if (filled("GMAIL_USER") !== filled("GMAIL_APP_PASSWORD")) {
  warnings.push("Only one of GMAIL_USER / GMAIL_APP_PASSWORD is set: e-mail stays off until both are. Check with npm run mail:check.");
}
if (filled("GMAIL_APP_PASSWORD") && !/^[a-z]{16}$/i.test(process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""))) {
  warnings.push("GMAIL_APP_PASSWORD is not a 16-letter Gmail app password (the normal Google password does not work): e-mail stays off.");
}
if (onVercel && !filled("GMAIL_USER") && !filled("RESEND_API_KEY")) {
  warnings.push("No e-mail provider configured: password reset, e-mail confirmation and order e-mails are off.");
}

for (const w of warnings) console.warn(`⚠ env: ${w}`);
if (errors.length > 0) {
  console.error("\n✖ Environment check failed:\n");
  for (const e of errors) console.error(`  • ${e}\n`);
  process.exit(1);
}
console.log("✓ Environment check passed");
