// Checks the e-mail setup without ever printing a password, key or token.
//   npm run mail:check                          → checks the variables and signs in to Gmail SMTP
//                                                 (nothing is sent)
//   npm run mail:check -- --send you@example.com → also sends one test e-mail to that address
// Reads the variables from the environment, .env.local or .env (project root), like the site.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import nodemailer from "nodemailer";
import { gmailSmtpOptions, isValidEmail, mailCheckPlan, readMailConfig, safeSmtpReason } from "../lib/mail-config";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  let values: Record<string, string | undefined>;
  try {
    values = parseEnv(readFileSync(path.join(root, file), "utf8"));
  } catch {
    continue; // Missing file: fine.
  }
  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

// Nothing is sent unless "--send <address>" is given explicitly.
const plan = mailCheckPlan(process.argv.slice(2));
const sendTo = plan.sendTo;

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const config = readMailConfig();
if (!config.ok) fail(`E-mail is not configured:\n  • ${config.problems.join("\n  • ")}`);
console.log(`✓ Variables look right · provider: ${config.provider} · sender: ${config.from}`);
for (const warning of config.warnings) console.warn(`⚠ ${warning}`);
for (const name of ["ADMIN_NOTIFY_EMAIL"]) {
  if (!isValidEmail(process.env[name]?.trim())) console.warn(`⚠ ${name} is not set (or not an address): no "new order" e-mail to the owner.`);
}
if (plan.error) fail(plan.error);

if (config.provider === "gmail" && config.gmail) {
  const transporter = nodemailer.createTransport(gmailSmtpOptions(config.gmail));
  try {
    await transporter.verify();
    console.log(`✓ Signed in to smtp.gmail.com:${config.gmail.port} as GMAIL_USER`);
  } catch (error) {
    const reason = safeSmtpReason(error);
    const hint = reason.startsWith("EAUTH")
      ? " — Gmail refused the sign-in: use a 16-letter app password (Google Account → Security → 2-Step Verification → App passwords), not the normal password, and check GMAIL_USER."
      : reason.startsWith("ETIMEDOUT") || reason.startsWith("ESOCKET") || reason.startsWith("ECONNECTION")
        ? " — smtp.gmail.com is unreachable from here (network or firewall). Try GMAIL_SMTP_PORT=587."
        : "";
    fail(`Gmail SMTP check failed: ${reason}${hint}`);
  }
  if (sendTo) {
    try {
      await transporter.sendMail({
        from: config.from,
        to: sendTo,
        subject: "BUNIQ: test e-mail",
        text: "The e-mail setup of the BUNIQ website works. You can delete this message.",
      });
      console.log("✓ Test e-mail sent. Check the inbox (and the spam folder).");
    } catch (error) {
      fail(`Sending failed: ${safeSmtpReason(error)}`);
    }
  }
  transporter.close();
} else {
  console.log("ℹ Resend is checked on the first real e-mail (no sign-in step without sending).");
}
