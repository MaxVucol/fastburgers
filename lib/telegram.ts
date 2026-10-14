import "server-only";

/**
 * Messages to the owner's Telegram chat through the official Bot API (`sendMessage` over HTTPS) —
 * no extra dependency. Configured by TELEGRAM_BOT_TOKEN (from @BotFather) and TELEGRAM_CHAT_ID
 * (the owner's personal chat). Without them sending is disabled. The token is part of the request
 * URL, so neither the URL nor raw fetch errors are ever logged.
 */
export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

/** Escapes text for Telegram's HTML parse mode (only &, < and > are special there). */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

export type TelegramResult = { ok: true } | { ok: false; reason: string };

/** Sends one HTML-formatted message; never throws. */
export async function sendTelegramMessage(html: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return { ok: false, reason: "not configured" };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return { ok: true };
    // Telegram's own description ("Bad Request: chat not found", "Unauthorized") holds no secrets.
    const body = (await response.json().catch(() => null)) as { description?: unknown } | null;
    const description = typeof body?.description === "string" ? body.description.slice(0, 200) : "";
    return { ok: false, reason: `HTTP ${response.status}${description ? ` ${description}` : ""}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : "network error" };
  }
}
