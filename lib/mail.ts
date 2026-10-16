import "server-only";
import { isValidEmail, readMailConfig } from "@/lib/mail-config";
import { outboundChannelsClosed } from "@/lib/preview-guard.mjs";
import { createGmailTransport, createResendTransport, type MailTransport, type OutgoingMail, type SendResult } from "@/lib/mail-transports";

/**
 * Transactional e-mail (account links, order e-mails). The business code only calls `sendMail`;
 * which provider delivers it is configuration:
 *
 *   EMAIL_PROVIDER      "gmail" | "resend" (optional: picked from the variables that are set)
 *   EMAIL_FROM          sender, e.g. "BUNIQ <orders@gmail.com>" (MAIL_FROM is accepted too)
 *   GMAIL_USER          Gmail address that sends (gmail)
 *   GMAIL_APP_PASSWORD  16-letter Gmail app password — never the normal Google password (gmail)
 *   GMAIL_SMTP_PORT     465 (TLS, default) or 587 (STARTTLS) (gmail, optional)
 *   RESEND_API_KEY      (resend)
 *
 * Without a complete configuration mail is disabled and callers say so instead of pretending a
 * message was sent. Nothing here ever logs a secret, a token, a link or a recipient address.
 */

export type MailMessage = { to: string; subject: string; text: string; html: string };

export { isValidEmail, readMailConfig, type MailConfig, type MailProvider } from "@/lib/mail-config";
let cached: { key: string; transport: MailTransport; from: string } | null = null;
let testTransport: { transport: MailTransport; from: string } | null = null;

/** Tests only: replaces the provider (pass null to restore). No real e-mail is ever sent then. */
export function setMailTransportForTests(transport: MailTransport | null, from = "BUNIQ <test@example.com>") {
  testTransport = transport ? { transport, from } : null;
}

function activeTransport(): { transport: MailTransport; from: string } | null {
  if (outboundChannelsClosed()) return null; // Preview e-mails nobody, whatever is configured (even a test transport)
  if (testTransport) return testTransport;
  const config = readMailConfig();
  if (!config.ok) return null;
  // Rebuilt only when the settings change (one SMTP transport per server instance).
  const key = `${config.provider}|${config.from}|${config.gmail?.user ?? ""}|${config.gmail?.port ?? ""}`;
  if (cached?.key !== key) {
    const transport = config.gmail ? createGmailTransport(config.gmail) : createResendTransport(config.resendKey!);
    cached = { key, transport, from: config.from };
  }
  return { transport: cached.transport, from: cached.from };
}

export function mailEnabled(): boolean {
  if (outboundChannelsClosed()) return false;
  return testTransport !== null || readMailConfig().ok;
}

/**
 * Sends one message. Never throws: returns `{ ok: false, reason }` when mail is disabled, the
 * address is invalid or the provider refused it. `reason` is safe to log (an error code, never a
 * message text, credentials or the recipient).
 */
export async function sendMail(message: MailMessage): Promise<SendResult> {
  const active = activeTransport();
  if (!active) return { ok: false, reason: "disabled" };
  if (!isValidEmail(message.to)) return { ok: false, reason: "invalid recipient" };
  const outgoing: OutgoingMail = { ...message, to: message.to.trim(), from: active.from };
  try {
    return await active.transport.send(outgoing);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : "unknown error" };
  }
}

export type { MailTransport, SendResult };
