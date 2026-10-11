// Integration tests of order creation against a real MongoDB replica set — a separate, seeded
// TEST database only (TEST_DATABASE_URL, name containing "test"); never the app's own database.
//   TEST_DATABASE_URL="mongodb://127.0.0.1:27017/fastburgers_test?replicaSet=rs0&directConnection=true" npm test
// Rate limits use an in-memory store here except in the test that exercises the MongoDB store.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";

const url = process.env.TEST_DATABASE_URL ?? "";
const usable = /test/i.test(new URL(url || "mongodb://x/none").pathname);

describe("orders (integration, test database)", { skip: usable ? false : "TEST_DATABASE_URL (a *test* database) is not set" }, () => {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";

  let mod: typeof import("@/services/orders");
  let rl: typeof import("@/lib/rate-limit");
  let prisma: typeof import("@/lib/prisma").prisma;
  let product: { id: string; price: number; options: { id: string; price: number }[] };
  let cheap: { id: string; price: number };

  before(async () => {
    mod = await import("@/services/orders");
    rl = await import("@/lib/rate-limit");
    prisma = (await import("@/lib/prisma")).prisma;
    const withOptions = await prisma.product.findFirst({
      where: { active: true, options: { some: { active: true } } },
      select: { id: true, price: true, options: { where: { active: true }, select: { id: true, price: true } } },
      orderBy: { price: "desc" },
    });
    assert.ok(withOptions, "seeded product with options");
    product = withOptions;
    const anyCheap = await prisma.product.findFirst({ where: { active: true }, orderBy: { price: "asc" }, select: { id: true, price: true } });
    assert.ok(anyCheap);
    cheap = anyCheap;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  const memory = () => rl.createMemoryRateLimitStore();
  const order = (over: Record<string, unknown> = {}) =>
    ({
      customerName: "Test Client",
      customerPhone: `07${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      customerEmail: "test@example.com",
      deliveryMethod: "DELIVERY",
      deliveryAddress: "Str. Test 1, ap. 2",
      locationId: "",
      paymentMethod: "CASH",
      notes: "",
      items: [{ productId: product.id, quantity: 1, optionIds: [product.options[0].id], unitPrice: product.price + product.options[0].price }],
      ...over,
    }) as Parameters<typeof mod.createOrder>[0];
  const count = () => prisma.order.count();

  test("parallel requests with one key (8 at once) create one order", async () => {
    const before = await count();
    const key = randomUUID();
    const data = order();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => mod.createOrder(data, { idempotencyKey: key, rateLimitStore: memory() })),
    );
    assert.equal(new Set(results.map((r) => r.number)).size, 1);
    assert.equal(await count(), before + 1);
    assert.equal(await prisma.orderRequest.count({ where: { key } }), 1);
  });

  test("a repeat after the order exists returns it without a new one", async () => {
    const key = randomUUID();
    const data = order();
    const first = await mod.createOrder(data, { idempotencyKey: key, rateLimitStore: memory() });
    const before = await count();
    const again = await mod.createOrder(data, { idempotencyKey: key, rateLimitStore: memory() });
    assert.equal(again.number, first.number);
    assert.equal(await count(), before);
  });

  test("two separate attempts (different keys) are two orders", async () => {
    const before = await count();
    const a = await mod.createOrder(order(), { idempotencyKey: randomUUID(), rateLimitStore: memory() });
    const b = await mod.createOrder(order(), { idempotencyKey: randomUUID(), rateLimitStore: memory() });
    assert.notEqual(a.number, b.number);
    assert.equal(await count(), before + 2);
  });

  test("a key reused for a different order is refused", async () => {
    const key = randomUUID();
    await mod.createOrder(order(), { idempotencyKey: key, rateLimitStore: memory() });
    const other = order({ items: [{ productId: product.id, quantity: 3, optionIds: [], unitPrice: product.price }] });
    await assert.rejects(mod.createOrder(other, { idempotencyKey: key, rateLimitStore: memory() }), { code: "attemptMismatch" });
  });

  test("a changed price refuses the order and returns current prices; the next attempt works", async () => {
    const before = await count();
    const stale = order({ items: [{ productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price - 100 }] });
    await assert.rejects(mod.createOrder(stale, { idempotencyKey: randomUUID(), rateLimitStore: memory() }), (error: unknown) => {
      assert.ok(error instanceof mod.OrderError);
      assert.equal(error.code, "priceChanged");
      assert.equal(error.detail.prices?.find((p) => p.productId === product.id)?.price, product.price);
      return true;
    });
    assert.equal(await count(), before, "nothing written");
    const fresh = order({ items: [{ productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price }] });
    await mod.createOrder(fresh, { idempotencyKey: randomUUID(), rateLimitStore: memory() });
    assert.equal(await count(), before + 1);
  });

  test("an unavailable product is named by id; nothing is written", async () => {
    const before = await count();
    const ghost = "0123456789abcdef01234567";
    const data = order({
      items: [
        { productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price },
        { productId: ghost, quantity: 1, optionIds: [], unitPrice: 1000 },
      ],
    });
    await assert.rejects(mod.createOrder(data, { rateLimitStore: memory() }), (error: unknown) => {
      assert.ok(error instanceof mod.OrderError);
      assert.equal(error.code, "productUnavailable");
      assert.deepEqual(error.detail.unavailable, [{ productId: ghost }]);
      return true;
    });
    assert.equal(await count(), before);
  });

  test("an unavailable option is named with its product", async () => {
    const ghostOption = "0123456789abcdef0123abcd";
    const data = order({ items: [{ productId: product.id, quantity: 1, optionIds: [ghostOption], unitPrice: product.price }] });
    await assert.rejects(mod.createOrder(data, { rateLimitStore: memory() }), (error: unknown) => {
      assert.ok(error instanceof mod.OrderError);
      assert.equal(error.code, "optionUnavailable");
      assert.deepEqual(error.detail.unavailable, [{ productId: product.id, optionId: ghostOption }]);
      return true;
    });
  });

  test("order rate limit: over the per-phone limit nothing is written", async () => {
    const store = memory();
    const phone = "0729999999";
    for (let i = 0; i < rl.RATE_LIMITS.orderPhone.limit; i++) {
      await mod.createOrder(order({ customerPhone: phone }), { idempotencyKey: randomUUID(), rateLimitStore: store });
    }
    const before = await count();
    await assert.rejects(mod.createOrder(order({ customerPhone: phone }), { idempotencyKey: randomUUID(), rateLimitStore: store }), {
      code: "tooManyOrders",
    });
    assert.equal(await count(), before);
    // A replay of an order already placed is still answered (it creates nothing).
  });

  test("order rate limit per IP across different phones", async () => {
    const store = memory();
    for (let i = 0; i < rl.RATE_LIMITS.orderIp.limit; i++) {
      await mod.createOrder(order(), { ip: "198.51.100.4", rateLimitStore: store });
    }
    await assert.rejects(mod.createOrder(order(), { ip: "198.51.100.4", rateLimitStore: store }), { code: "tooManyOrders" });
    await mod.createOrder(order(), { ip: "198.51.100.5", rateLimitStore: store });
  });

  test("minimum and delivery fee are computed on the server", async () => {
    const tiny = order({ items: [{ productId: cheap.id, quantity: 1, optionIds: [], unitPrice: cheap.price }] });
    if (cheap.price < 3000) {
      await assert.rejects(mod.createOrder(tiny, { rateLimitStore: memory() }), { code: "minDelivery" });
    }
    const created = await mod.createOrder(order({ items: [{ productId: product.id, quantity: 2, optionIds: [], unitPrice: product.price }] }), {
      rateLimitStore: memory(),
      demo: true,
    });
    const saved = await prisma.order.findUnique({ where: { number: created.number }, include: { items: true } });
    assert.ok(saved);
    assert.equal(saved.subtotal, product.price * 2);
    assert.equal(saved.deliveryFee, saved.subtotal >= 8000 ? 0 : 999);
    assert.equal(saved.total, saved.subtotal + saved.deliveryFee);
    assert.equal(saved.items.length, 1, "lines written with the order");
    assert.equal(saved.demo, true);
  });

  test("MongoDB rate-limit store: parallel hits are counted atomically", async () => {
    const rule = { name: `test-${randomUUID()}`, limit: 5, windowMs: 60_000 };
    const results = await Promise.all(Array.from({ length: 12 }, () => rl.consume(rule, "203.0.113.9")));
    assert.equal(results.filter((r) => r.ok).length, 5);
    await rl.resetLimit(rule, "203.0.113.9");
    assert.deepEqual(await rl.consume(rule, "203.0.113.9"), { ok: true });
  });
});
