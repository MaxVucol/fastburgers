// Telegram "new order" message: formatting and escaping, and the Bot API call (fetch is stubbed —
// these tests never reach Telegram).
import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/telegram";
import { formatOrderMessage, type NotifiedOrder } from "@/services/order-notifications";

const order = (over: Partial<NotifiedOrder> = {}): NotifiedOrder => ({
  id: "665f00000000000000000001",
  number: "FB-7K2M9Q4A",
  createdAt: new Date("2026-10-14T12:05:00Z"),
  customerName: "Ana <b>Pop</b> & Co",
  customerPhone: "+373 69 123 456",
  deliveryMethod: "DELIVERY",
  deliveryAddress: "Str. Ștefan cel Mare 1, ap. 5",
  location: null,
  paymentMethod: "CASH",
  paymentBank: null,
  subtotal: 7580,
  deliveryFee: 999,
  total: 8579,
  notes: "Fără ceapă <please>",
  demo: null,
  items: [
    { productName: "Classic Smash", quantity: 2, price: 3790, total: 7580, options: [{ name: "Extra cheddar", price: 500 }] },
  ],
  ...over,
});

describe("Telegram order message", () => {
  test("contains the saved order's facts, escaped for HTML mode", () => {
    const text = formatOrderMessage(order(), "https://example.md/admin/orders/1");
    assert.match(text, /НОВЫЙ ЗАКАЗ — FASTBURGERS/);
    assert.match(text, /FB-7K2M9Q4A/);
    assert.match(text, /14\.10\.2026, 15:05/); // Chișinău time (UTC+3 in October)
    assert.match(text, /Ana &lt;b&gt;Pop&lt;\/b&gt; &amp; Co/);
    assert.ok(!text.includes("<b>Pop</b>"));
    assert.match(text, /\+373 69 123 456/);
    assert.match(text, /Получение:<\/b> доставка/);
    assert.match(text, /Адрес:<\/b> Str\. Ștefan cel Mare 1, ap\. 5/);
    assert.match(text, /1\. Classic Smash × 2 — 75,80 лей/);
    assert.match(text, /\+ Extra cheddar \(\+5,00 лей\)/);
    assert.match(text, /37,90 лей за шт\./);
    assert.match(text, /Доставка:<\/b> 9,99 лей/);
    assert.match(text, /Итого: 85,79 лей \(MDL\)/);
    assert.match(text, /Наличными при получении/);
    assert.match(text, /Комментарий:<\/b> Fără ceapă &lt;please&gt;/);
    assert.match(text, /<a href="https:\/\/example\.md\/admin\/orders\/1">/);
    assert.ok(!/Демо/.test(text));
  });

  test("pickup: restaurant instead of address, no delivery line; missing fields are left out", () => {
    const text = formatOrderMessage(
      order({ deliveryMethod: "PICKUP", deliveryAddress: null, location: { name: "BUNIQ Centru", address: "Bd. Test 2" }, deliveryFee: 0, total: 7580, notes: null, demo: true }),
      "https://example.md/a",
    );
    assert.match(text, /Получение:<\/b> самовывоз/);
    assert.match(text, /Ресторан:<\/b> BUNIQ Centru, Bd\. Test 2/);
    assert.ok(!/Адрес:/.test(text));
    assert.ok(!/Доставка:/.test(text));
    assert.ok(!/Комментарий/.test(text));
    assert.match(text, /Демо-заказ/);
  });

  test("card payment shows the bank; online orders are flagged as unpaid", () => {
    const courier = formatOrderMessage(order({ paymentMethod: "CARD_ON_DELIVERY", paymentBank: "victoriabank" }), "https://x.md");
    assert.match(courier, /Оплата:<\/b> Картой при получении · Victoriabank/);
    assert.ok(!/Не оплачено/.test(courier));
    const online = formatOrderMessage(order({ paymentMethod: "CARD_ONLINE", paymentBank: "other" }), "https://x.md");
    assert.match(online, /Оплата:<\/b> Картой онлайн · другой банк/);
    assert.match(online, /Не оплачено/);
  });

  test("free delivery is stated, not shown as 0", () => {
    assert.match(formatOrderMessage(order({ deliveryFee: 0 }), "https://x.md"), /Доставка:<\/b> бесплатно/);
  });

  test("stays under Telegram's 4096-character limit for huge orders", () => {
    const items = Array.from({ length: 120 }, (_, i) => ({ productName: `Burger ${i} ${"x".repeat(40)}`, quantity: 3, price: 100, total: 300, options: [] }));
    const text = formatOrderMessage(order({ items }), "https://x.md");
    assert.ok(text.length <= 4096);
    assert.match(text, /и ещё \d+ поз\./);
    assert.match(text, /Итого:/);
  });

  test("escapes only what HTML mode needs", () => {
    assert.equal(escapeTelegramHtml(`a<b>&"c'`), `a&lt;b&gt;&amp;"c'`);
  });
});

describe("sendTelegramMessage", () => {
  const realFetch = globalThis.fetch;
  const env = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID };
  afterEach(() => {
    globalThis.fetch = realFetch;
    process.env.TELEGRAM_BOT_TOKEN = env.token;
    process.env.TELEGRAM_CHAT_ID = env.chat;
    if (env.token === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    if (env.chat === undefined) delete process.env.TELEGRAM_CHAT_ID;
  });
  const configure = () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:TEST-TOKEN";
    process.env.TELEGRAM_CHAT_ID = "42";
  };

  test("disabled without configuration (no request made)", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    let called = false;
    globalThis.fetch = (async () => ((called = true), new Response("{}"))) as typeof fetch;
    assert.deepEqual(await sendTelegramMessage("hi"), { ok: false, reason: "not configured" });
    assert.equal(called, false);
  });

  test("posts to sendMessage with HTML parse mode", async () => {
    configure();
    let seen: { url: string; body: Record<string, unknown> } | null = null;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      seen = { url, body: JSON.parse(String(init.body)) };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;
    assert.deepEqual(await sendTelegramMessage("<b>x</b>"), { ok: true });
    assert.equal(seen!.url, "https://api.telegram.org/bot123:TEST-TOKEN/sendMessage");
    assert.equal(seen!.body.chat_id, "42");
    assert.equal(seen!.body.parse_mode, "HTML");
    assert.equal(seen!.body.text, "<b>x</b>");
  });

  test("API error: reports Telegram's reason, never the token", async () => {
    configure();
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: false, description: "Bad Request: chat not found" }), { status: 400 })) as typeof fetch;
    const result = await sendTelegramMessage("x");
    assert.equal(result.ok, false);
    assert.ok(!result.ok && result.reason === "HTTP 400 Bad Request: chat not found");
    assert.ok(!JSON.stringify(result).includes("TEST-TOKEN"));
  });

  test("network failure or timeout: does not throw", async () => {
    configure();
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed https://api.telegram.org/bot123:TEST-TOKEN/sendMessage");
    }) as typeof fetch;
    const result = await sendTelegramMessage("x");
    assert.deepEqual(result, { ok: false, reason: "TypeError" });
  });
});
