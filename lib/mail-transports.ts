import "server-only";
import nodemailer from "nodemailer";
import { gmailSmtpOptions, safeSmtpReason } from "@/lib/mail-config";

/** A fully addressed message as a provider receives it. */
export type OutgoingMail = { from: string; to: string; subject: string; text: string; html: string };
export type SendResult = { ok: true } | { ok: false; reason: string };

/** One way of delivering mail. Adding a provider means adding one of these, nothing else. */
export interface MailTransport {
  send(mail: OutgoingMail): Promise<SendResult>;
}

type SmtpTransporter = { sendMail(mail: OutgoingMail): Promise<unknown>; verify(): Promise<unknown> };
type TransportFactory = (options: Record<string, unknown>) => SmtpTransporter;

export function createGmailTransport(
  settings: { user: string; pass: string; port: 465 | 587 },
  factory: TransportFactory = nodemailer.createTransport as unknown as TransportFactory,
): MailTransport & { verify(): Promise<SendResult> } {
  const transporter = factory(gmailSmtpOptions(settings));
  return {
    async send(mail) {
      try {
        await transporter.sendMail(mail);
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: safeSmtpReason(error) };
      }
    },
    /** Signs in to the SMTP server without sending anything. */
    async verify() {
      try {
        await transporter.verify();
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: safeSmtpReason(error) };
      }
    },
  };
}

/** Resend's HTTP API (no extra dependency). */
export function createResendTransport(apiKey: string, fetchImpl: typeof fetch = fetch): MailTransport {
  return {
    async send(mail) {
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: mail.from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
          signal: AbortSignal.timeout(10_000),
        });
        return response.ok ? { ok: true } : { ok: false, reason: `HTTP ${response.status}` };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.name : "network error" };
      }
    },
  };
}
