// Integration tests of the Telegram "new order" notification against the TEST database only
// (TEST_DATABASE_URL, name containing "test"). Telegram itself is replaced by a recording stub.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";

const url = process.env.TEST_DATABASE_URL ?? "";
const usable = /test/i.test(new URL(url || "mongodb://x/none").pathname);

describe("order notifications (integration, test database)", { skip: usable ? false : "TEST_DATABASE_URL (a *test* database) is not set" }, () => {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";

  let orders: typeof import("@/services/orders");
  let notify: typeof import("@/services/order-notifications").notifyNewOrder;
  let rl: typeof import("@/lib/rate-limit");
  let prisma: typeof import("@/lib/prisma").prisma;
  let product: { id: string; price: number; name: string };

  before(async () => {
    orders = await import("@/services/orders");
    notify = (await import("@/services/order-notifications")).notifyNewOrder;
    rl = await import("@/lib/rate-limit");
    prisma = (await import("@/lib/prisma")).prisma;
    const p = await prisma.product.findFirst({ where: { active: true, price: { gte: 3000 } }, select: { id: true, price: true, name: true } });
    assert.ok(p);
    product = p;
  });
  after(() => prisma.$disconnect());

  const data = () =>
    ({
      customerName: "Notify <Test>",
      customerPhone: `07${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      customerEmail: "notify@example.com",
      deliveryMethod: "DELIVERY",
      deliveryAddress: "Str. Test 1",
      locationId: "",
      paymentMethod: "CASH",
      notes: "",
      items: [{ productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price }],
    }) as Parameters<typeof orders.createOrder>[0];
  const place = (d = data(), key = randomUUID()) => orders.createOrder(d, { idempotencyKey: key, rateLimitStore: rl.createMemoryRateLimitStore() });

  /** Telegram stub: records messages, answers with `result`. */
  const stub = (result: { ok: true } | { ok: false; reason: string } = { ok: true }) => {
    const sent: string[] = [];
    const send = async (html: string) => (sent.push(html), result);
    return { sent, send };
  };
  const notifiedAt = async (id: string) =>
    (await prisma.order.findUnique({ where: { id }, select: { telegramNotifiedAt: true } }))?.telegramNotifiedAt ?? null;

  test("success: one message built from the saved order, then marked as notified", async () => {
    const order = await place();
    const tg = stub();
    assert.equal(await notify(order.id, tg.send), "sent");
    assert.equal(tg.sent.length, 1);
    assert.match(tg.sent[0], new RegExp(order.number));
    assert.match(tg.sent[0], /Notify &lt;Test&gt;/);
    assert.ok(tg.sent[0].includes(product.name.replace(/&/g, "&amp;")));
    assert.ok(await notifiedAt(order.id));

    // A second call (another request, a retry) sends nothing.
    assert.equal(await notify(order.id, tg.send), "skipped");
    assert.equal(tg.sent.length, 1);
  });

  test("replayed checkout: same order, a single notification", async () => {
    const d = data();
    const key = randomUUID();
    const tg = stub();
    const first = await place(d, key);
    assert.equal(await notify(first.id, tg.send), "sent");
    const replay = await place(d, key);
    assert.equal(replay.id, first.id);
    assert.equal(await notify(replay.id, tg.send), "skipped");
    assert.equal(tg.sent.length, 1);
    assert.equal(await prisma.order.count({ where: { customerPhone: d.customerPhone } }), 1);
  });

  test("parallel calls for one order send exactly one message", async () => {
    const order = await place();
    const tg = stub();
    const results = await Promise.all(Array.from({ length: 5 }, () => notify(order.id, tg.send)));
    assert.equal(results.filter((r) => r === "sent").length, 1);
    assert.equal(tg.sent.length, 1);
  });

  test("Telegram error: the order stays saved, no new order, and a later call can retry", async () => {
    const d = data();
    const key = randomUUID();
    const order = await place(d, key);
    const failing = stub({ ok: false, reason: "HTTP 502" });
    assert.equal(await notify(order.id, failing.send), "failed");
    assert.ok(await prisma.order.findUnique({ where: { id: order.id }, select: { id: true } }), "order kept");
    assert.equal(await notifiedAt(order.id), null, "mark released for a retry");

    // The customer retries the same attempt: the same order comes back, nothing new is created.
    const replay = await place(d, key);
    assert.equal(replay.id, order.id);
    assert.equal(await prisma.order.count({ where: { customerPhone: d.customerPhone } }), 1);

    const ok = stub();
    assert.equal(await notify(order.id, ok.send), "sent");
    assert.equal(ok.sent.length, 1);
  });

  test("a throwing sender does not break anything either", async () => {
    const order = await place();
    const result = await notify(order.id, async () => {
      throw new Error("boom");
    });
    assert.equal(result, "failed");
    assert.ok(await prisma.order.findUnique({ where: { id: order.id }, select: { id: true } }));
    assert.equal(await notifiedAt(order.id), null);
  });

  test("online payment: saved unpaid with the chosen bank, flagged in the message; cash stores no bank", async () => {
    const online = await place({ ...data(), paymentMethod: "CARD_ONLINE", paymentBank: "maib" });
    const row = await prisma.order.findUnique({ where: { id: online.id }, select: { paymentMethod: true, paymentBank: true } });
    assert.deepEqual(row, { paymentMethod: "CARD_ONLINE", paymentBank: "maib" });
    const tg = stub();
    assert.equal(await notify(online.id, tg.send), "sent");
    assert.match(tg.sent[0], /Картой онлайн · maib/);
    assert.match(tg.sent[0], /Не оплачено/);

    const cash = await place({ ...data(), paymentBank: "maib" });
    assert.equal((await prisma.order.findUnique({ where: { id: cash.id }, select: { paymentBank: true } }))?.paymentBank, null);
  });

  test("order not saved: nothing to notify", async () => {
    const d = data();
    d.items = [{ productId: "665f0000000000000000dead", quantity: 1, optionIds: [] }];
    await assert.rejects(place(d), { code: "productUnavailable" });
    assert.equal(await prisma.order.count({ where: { customerPhone: d.customerPhone } }), 0);

    // An id that does not belong to a saved order never produces a message.
    const tg = stub();
    assert.equal(await notify("665f0000000000000000beef", tg.send), "skipped");
    assert.equal(tg.sent.length, 0);
  });
});
