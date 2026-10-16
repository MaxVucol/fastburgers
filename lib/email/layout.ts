import { siteConfig } from "@/lib/site";

/**
 * The BUNIQ e-mail frame: a single centred column (max 560 px) built with tables and inline styles,
 * which is what mail clients render reliably, and which shrinks to the phone's width. Text only, no
 * remote images (often blocked); the wordmark is set in type in the brand orange.
 */

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = { accent: "#ff6b2e", ink: "#242424", muted: "#615c54", cream: "#f6f3ea", line: "#e2dccd", paper: "#ffffff" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailBlock =
  | { kind: "p"; text: string }
  | { kind: "muted"; text: string }
  | { kind: "button"; label: string; url: string }
  /** Label / value rows (order details). */
  | { kind: "rows"; rows: { label: string; value: string; strong?: boolean }[] }
  | { kind: "list"; items: string[] };

export type Email = { subject: string; preheader: string; heading: string; blocks: EmailBlock[]; footer: string; lang: string };

function blockHtml(block: EmailBlock): string {
  switch (block.kind) {
    case "p":
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${C.ink}">${escapeHtml(block.text)}</p>`;
    case "muted":
      return `<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${C.muted}">${escapeHtml(block.text)}</p>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${C.accent}">
<a href="${escapeHtml(block.url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:${C.ink};text-decoration:none;border-radius:999px">${escapeHtml(block.label)}</a>
</td></tr></table>
<p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${C.muted};word-break:break-all">${escapeHtml(block.url)}</p>`;
    case "rows":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-top:1px solid ${C.line}">${block.rows
        .map(
          (r) => `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.muted};vertical-align:top">${escapeHtml(r.label)}</td>
<td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.ink};text-align:right;vertical-align:top;${r.strong ? "font-weight:800" : ""}">${escapeHtml(r.value)}</td></tr>`,
        )
        .join("")}</table>`;
    case "list":
      return `<ul style="margin:0 0 20px;padding:0 0 0 20px;font-size:15px;line-height:1.6;color:${C.ink}">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  }
}

function blockText(block: EmailBlock): string {
  switch (block.kind) {
    case "p":
    case "muted":
      return block.text;
    case "button":
      return `${block.label}: ${block.url}`;
    case "rows":
      return block.rows.map((r) => `${r.label}: ${r.value}`).join("\n");
    case "list":
      return block.items.map((i) => `• ${i}`).join("\n");
  }
}

export function renderEmail(email: Email, to: string) {
  const html = `<!doctype html>
<html lang="${escapeHtml(email.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(email.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(email.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${FONT}">
<tr><td style="background:${C.ink};border-radius:16px 16px 0 0;padding:20px 28px">
<span style="font-size:24px;font-weight:900;letter-spacing:0.04em;color:${C.accent}">${escapeHtml(siteConfig.name)}</span>
<span style="font-size:12px;color:#aaa49a;padding-left:8px">${escapeHtml(siteConfig.tagline)}</span>
</td></tr>
<tr><td style="background:${C.paper};border-radius:0 0 16px 16px;padding:28px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:800;color:${C.ink}">${escapeHtml(email.heading)}</h1>
${email.blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td style="padding:18px 8px;font-size:12px;line-height:1.5;color:${C.muted};text-align:center">${escapeHtml(email.footer)}<br><a href="${escapeHtml(siteConfig.url)}" style="color:${C.muted}">${escapeHtml(siteConfig.url.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [email.heading, "", ...email.blocks.map(blockText).flatMap((t) => [t, ""]), "—", email.footer, siteConfig.url].join("\n");
  return { to, subject: email.subject, html, text };
}
