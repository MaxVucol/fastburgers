import "server-only";
import { linkEmail, noticeEmail } from "@/lib/email/templates";
import { mailStrings } from "@/lib/email/strings";
import { fill, localizePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mailEnabled, sendMail, type MailMessage, type SendResult } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { consumeAll, mongoRateLimitStore, RATE_LIMITS, type RateLimitStore } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { issueToken, requestEmailChange } from "@/services/accounts";

/**
 * E-mails of the account pages: confirmation of the address, password reset, e-mail change and the
 * "Google connected" notice. Rate limits are checked first and answered at once; the e-mail itself
 * is delivered by the returned `deliver` (the action runs it after the response), so the answer and
 * its timing never depend on whether an address has an account. Links carry the raw one-time token
 * (only its hash is stored) and are never logged.
 */

type Send = (message: MailMessage) => Promise<SendResult>;
export type Deps = { send?: Send; store?: RateLimitStore };
export type Limited = { kind: "limited"; retryAfterSeconds: number };

const link = (locale: Locale, path: string) => absoluteUrl(localizePath(locale, path));

async function deliver(message: MailMessage, label: string, send: Send) {
  const result = await send(message).catch((): SendResult => ({ ok: false, reason: "exception" }));
  if (!result.ok) console.error(`Account e-mail (${label}) failed: ${result.reason}`);
  return result.ok;
}

/** Confirmation link for the account's current address. */
export async function sendVerificationEmail(userId: string, email: string, locale: Locale, send: Send = sendMail) {
  const t = getDictionary(locale).me.verify;
  const token = await issueToken(userId, "EMAIL_VERIFY");
  return deliver(
    linkEmail(locale, email, { subject: t.mailSubject, heading: t.title, intro: t.mailIntro, button: t.mailButton, outro: t.mailOutro }, link(locale, `/account/verify?token=${token}`)),
    "verify",
    send,
  );
}

/** "Send the link again": at most one per minute and three per hour per account. */
export async function resendVerification(
  user: { id: string; email: string; emailVerified: boolean },
  locale: Locale,
  { send = sendMail, store = mongoRateLimitStore }: Deps = {},
): Promise<{ kind: "verified" | "disabled" | "sent" | "failed" } | Limited> {
  if (user.emailVerified) return { kind: "verified" };
  if (send === sendMail && !mailEnabled()) return { kind: "disabled" };
  const limited = await consumeAll(
    [
      { rule: RATE_LIMITS.verifyCooldown, id: user.id },
      { rule: RATE_LIMITS.verifyAccount, id: user.id },
    ],
    store,
  );
  if (!limited.ok) return { kind: "limited", retryAfterSeconds: limited.retryAfterSeconds };
  return { kind: (await sendVerificationEmail(user.id, user.email, locale, send)) ? "sent" : "failed" };
}

/**
 * "Forgot password". Counts the request (per IP and per address, existing or not) and returns the
 * delivery to run afterwards; it sends only to an existing, unblocked account.
 */
export async function requestPasswordReset(
  email: string,
  locale: Locale,
  ip: string | null,
  { send = sendMail, store = mongoRateLimitStore }: Deps = {},
): Promise<{ kind: "disabled" } | Limited | { kind: "accepted"; deliver: () => Promise<boolean> }> {
  if (send === sendMail && !mailEnabled()) return { kind: "disabled" };
  const limited = await consumeAll(
    [
      { rule: RATE_LIMITS.resetIp, id: ip },
      { rule: RATE_LIMITS.resetAccount, id: email },
    ],
    store,
  );
  if (!limited.ok) return { kind: "limited", retryAfterSeconds: limited.retryAfterSeconds };
  return {
    kind: "accepted",
    deliver: async () => {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, blockedAt: true } });
      if (!user || user.blockedAt) return false;
      const t = getDictionary(locale).me.forgot;
      const token = await issueToken(user.id, "PASSWORD_RESET");
      return deliver(
        linkEmail(locale, user.email, { subject: t.mailSubject, heading: t.title, intro: t.mailIntro, button: t.mailButton, outro: t.mailOutro }, link(locale, `/account/reset?token=${token}`)),
        "reset",
        send,
      );
    },
  };
}

/**
 * E-mail change, first step. Wrong password and rate limits are answered directly; otherwise the
 * answer is the same whether or not the new address is free (no account discovery), and `deliver`
 * sends the link to the new address plus a notice to the old one.
 */
export async function startEmailChange(
  user: { id: string; email: string },
  newEmail: string,
  password: string,
  locale: Locale,
  { send = sendMail, store = mongoRateLimitStore }: Deps = {},
): Promise<{ kind: "disabled" } | Limited | { kind: "accepted"; deliver: () => Promise<boolean> }> {
  if (send === sendMail && !mailEnabled()) return { kind: "disabled" };
  const limited = await consumeAll(
    [
      { rule: RATE_LIMITS.emailChangeAccount, id: user.id },
      // Guessing the password through this form counts as sign-in attempts.
      { rule: RATE_LIMITS.loginAccount, id: user.email },
    ],
    store,
  );
  if (!limited.ok) return { kind: "limited", retryAfterSeconds: limited.retryAfterSeconds };
  const request = await requestEmailChange(user.id, newEmail, password); // throws wrongPassword / sameEmail / noPassword
  return {
    kind: "accepted",
    deliver: async () => {
      if (!request.send) return false;
      const s = mailStrings[locale];
      const sent = await deliver(linkEmail(locale, request.newEmail, s.emailChange, link(locale, `/account/confirm-email?token=${request.token}`)), "email change", send);
      await deliver(noticeEmail(locale, request.oldEmail, s.emailChangeNotice), "email change notice", send);
      return sent;
    },
  };
}

/** Security notice after Google was connected to an account. */
export function sendGoogleLinkedNotice(to: string, googleEmail: string, locale: Locale, send: Send = sendMail) {
  const s = mailStrings[locale].googleLinked;
  return deliver(noticeEmail(locale, to, { ...s, intro: fill(s.intro, { email: googleEmail }) }), "google linked", send);
}
