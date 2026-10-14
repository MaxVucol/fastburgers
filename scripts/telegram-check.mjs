// Checks the Telegram setup for order notifications without ever printing the bot token.
//   npm run telegram:check              → checks the token (getMe) and lists chats that wrote to the bot
//                                          (getUpdates), so you can copy your TELEGRAM_CHAT_ID
//   npm run telegram:check -- --send    → also sends a test message to TELEGRAM_CHAT_ID
// Reads TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID from the environment, .env.local or .env (in the
// project root, wherever the command is started from).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  let values;
  try {
    values = parseEnv(readFileSync(path.join(root, file), "utf8"));
  } catch {
    continue; // Missing file: fine.
  }
  // Unlike process.loadEnvFile, an empty variable left in the shell does not hide the file's value.
  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
const send = process.argv.includes("--send");

/** Removes the token from anything that is printed, just in case Telegram echoes it. */
const safe = (text) => (token ? String(text).split(token).join("<token>") : String(text));

function fail(message) {
  console.error(`✖ ${safe(message)}`);
  process.exit(1);
}

async function call(method, body) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    // Never print the error itself: its message or cause may contain the request URL (with the token).
    fail(`Telegram is unreachable (${error instanceof Error ? error.name : "network error"}). Check the internet connection.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const reason = typeof data.description === "string" ? data.description : `HTTP ${response.status}`;
    const hint =
      response.status === 401 || response.status === 404
        ? " — the token is wrong: copy it again from @BotFather (the whole line, e.g. 123456789:AA…)."
        : response.status === 400 && /chat not found/i.test(reason)
          ? " — TELEGRAM_CHAT_ID is wrong, or you have not pressed Start in the bot yet."
          : response.status === 403
            ? " — the bot cannot write to this chat: open the bot and press Start (or unblock it)."
            : "";
    fail(`${method}: ${reason}${hint}`);
  }
  return data.result;
}

if (!token) fail("TELEGRAM_BOT_TOKEN is empty. Paste the token from @BotFather into .env (TELEGRAM_BOT_TOKEN=\"…\").");
if (!/^\d+:[\w-]{30,}$/.test(token)) {
  console.warn("! TELEGRAM_BOT_TOKEN does not look like a bot token (expected 123456789:AA…); trying anyway.");
}

const bot = await call("getMe");
console.log(`✔ Token works: bot @${bot.username} (${bot.first_name}).`);

const updates = await call("getUpdates", { limit: 100, allowed_updates: ["message"] });
const chats = new Map();
for (const update of updates ?? []) {
  const chat = update.message?.chat ?? update.edited_message?.chat;
  if (chat) chats.set(chat.id, chat);
}
if (chats.size === 0) {
  console.log(`  No messages to the bot yet. Open https://t.me/${bot.username} in Telegram, press Start, then run this again.`);
} else {
  console.log("  Chats that wrote to the bot recently (use the id of your personal chat):");
  for (const chat of chats.values()) {
    const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.title || "";
    console.log(`    TELEGRAM_CHAT_ID="${chat.id}"   ${chat.type}${name ? ` · ${name}` : ""}${chat.username ? ` · @${chat.username}` : ""}`);
  }
}

if (!chatId) {
  console.log("  TELEGRAM_CHAT_ID is empty: copy the line above into .env, then run: npm run telegram:check -- --send");
} else if (!send) {
  console.log(`  TELEGRAM_CHAT_ID is set${chats.has(Number(chatId)) ? " and matches a chat above" : ""}. To send a test message: npm run telegram:check -- --send`);
} else {
  await call("sendMessage", {
    chat_id: chatId,
    text: "✅ Fastburgers: тестовое сообщение. Уведомления о новых заказах будут приходить в этот чат.",
  });
  console.log("✔ Test message sent. Check Telegram.");
}
