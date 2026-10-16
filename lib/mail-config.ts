// Mail settings: reading and checking them. Pure (no "server-only"), so `npm run mail:check`
// (scripts/mail-check.mts) uses exactly the rules the site uses. Reports only variable names and
// what is wrong with them — never a value.

export type MailProvider = "gmail" | "resend";

export type MailConfig =
  | { ok: true; provider: MailProvider; from: string; warnings: string[]; gmail?: { user: string; pass: string; port: 465 | 587 }; resendKey?: string }
  | { ok: false; problems: string[] };

type Env = Record<string, string | undefined>;

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
/** "Name <a@b.c>" or "a@b.c". */
const FROM = /^(?:[^<>]{1,80}\s<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL.test(value.trim());
}

/** The address part of "Name <a@b.c>". */
function fromAddress(from: string) {
  return (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
}

/**
 * Reads and checks the mail settings. Only names and what is wrong with them are reported,
 * never values. Pure (takes the environment), so the check script and the tests share it.
 */
export function readMailConfig(env: Env = process.env): MailConfig {
  const v = (name: string) => env[name]?.trim() ?? "";
  const requested = v("EMAIL_PROVIDER").toLowerCase();
  const provider: MailProvider | "" =
    requested === "gmail" || requested === "resend" ? requested : requested ? "" : v("GMAIL_USER") ? "gmail" : v("RESEND_API_KEY") ? "resend" : "";
  if (requested && !provider) return { ok: false, problems: ['EMAIL_PROVIDER must be "gmail" or "resend".'] };
  if (!provider) return { ok: false, problems: ["No e-mail provider is configured (set GMAIL_USER and GMAIL_APP_PASSWORD, or RESEND_API_KEY)."] };

  const problems: string[] = [];
  const warnings: string[] = [];
  const explicitFrom = v("EMAIL_FROM") || v("MAIL_FROM");
  if (explicitFrom && !FROM.test(explicitFrom)) problems.push('EMAIL_FROM must look like "BUNIQ <name@example.com>" or "name@example.com".');

  if (provider === "gmail") {
    const user = v("GMAIL_USER").toLowerCase();
    // Google shows app passwords in groups of four ("abcd efgh ijkl mnop"); spaces are not part of it.
    const pass = v("GMAIL_APP_PASSWORD").replace(/\s+/g, "");
    const portRaw = v("GMAIL_SMTP_PORT") || "465";
    if (!isValidEmail(user)) problems.push("GMAIL_USER must be the full Gmail address that sends the e-mails.");
    if (!pass) problems.push("GMAIL_APP_PASSWORD is not set.");
    // An app password is exactly 16 letters; anything else is most likely the normal Google password.
    else if (!/^[a-z]{16}$/i.test(pass)) problems.push("GMAIL_APP_PASSWORD must be a 16-letter Gmail app password (not the normal Google password).");
    if (portRaw !== "465" && portRaw !== "587") problems.push("GMAIL_SMTP_PORT must be 465 or 587.");
    if (problems.length) return { ok: false, problems };
    const from = explicitFrom || `BUNIQ <${user}>`;
    if (fromAddress(from) !== user) {
      warnings.push("EMAIL_FROM differs from GMAIL_USER: Gmail sends it only if that address is set up under “Send mail as”; otherwise it shows GMAIL_USER.");
    }
    return { ok: true, provider, from, warnings, gmail: { user, pass, port: portRaw === "587" ? 587 : 465 } };
  }

  const resendKey = v("RESEND_API_KEY");
  if (!resendKey) problems.push("RESEND_API_KEY is not set.");
  if (!explicitFrom) problems.push("EMAIL_FROM is required with Resend (a sender on a domain verified in Resend).");
  if (problems.length) return { ok: false, problems };
  return { ok: true, provider, from: explicitFrom, warnings, resendKey };
}

/**
 * A short, log-safe reason for a failed send: Nodemailer's error code and the SMTP status
 * ("EAUTH 535", "ETIMEDOUT"), never the error message, which may quote the server's reply.
 */
export function safeSmtpReason(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown error";
  const { code, responseCode } = error as { code?: unknown; responseCode?: unknown };
  const parts = [typeof code === "string" && /^[A-Z_]{2,30}$/.test(code) ? code : "SMTP_ERROR"];
  if (typeof responseCode === "number") parts.push(String(responseCode));
  return parts.join(" ");
}

/** Gmail's SMTP server with an app password: port 465 (TLS from the start) or 587 (STARTTLS). */
export function gmailSmtpOptions({ user, pass, port }: { user: string; pass: string; port: 465 | 587 }) {
  return {
    host: "smtp.gmail.com",
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user, pass },
    // Fail fast instead of holding a serverless function open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    // Never log the SMTP conversation (it contains the AUTH exchange).
    logger: false,
    debug: false,
  };
}


/**
 * What `npm run mail:check` should do. It only signs in to the SMTP server unless `--send` is
 * given explicitly with one valid address: then it sends a single test e-mail to that address.
 */
export function mailCheckPlan(argv: readonly string[]): { sendTo: string | null; error?: string } {
  const index = argv.indexOf("--send");
  if (index === -1) return { sendTo: null };
  const to = (argv[index + 1] ?? "").trim();
  return isValidEmail(to) ? { sendTo: to } : { sendTo: null, error: "Usage: npm run mail:check -- --send you@example.com" };
}
