import "server-only";

/**
 * Transactional e-mail (password reset, e-mail verification) through the Resend HTTP API — no
 * extra dependency. Configured by RESEND_API_KEY and MAIL_FROM (a sender on a verified domain).
 * Without them mail is disabled: callers must say so instead of pretending a message was sent.
 */
export function mailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
}

export type MailMessage = { to: string; subject: string; text: string; html: string };

/** Sends one message; false when mail is disabled or the provider refused it (never throws). */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!mailEnabled()) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error("sendMail: provider answered", response.status);
    return response.ok;
  } catch (error) {
    console.error("sendMail failed", error instanceof Error ? error.name : "");
    return false;
  }
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain, brand-neutral message with one button; `link` is an absolute URL built by the caller. */
export function linkMessage(to: string, subject: string, intro: string, button: string, link: string, outro: string): MailMessage {
  return {
    to,
    subject,
    text: `${intro}\n\n${link}\n\n${outro}`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#242424;max-width:520px">
<p style="font-size:22px;font-weight:800;margin:0 0 16px">BUNIQ</p>
<p>${escape(intro)}</p>
<p><a href="${escape(link)}" style="display:inline-block;background:#ff6b2e;color:#242424;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">${escape(button)}</a></p>
<p style="color:#615c54;font-size:14px">${escape(outro)}</p></div>`,
  };
}
