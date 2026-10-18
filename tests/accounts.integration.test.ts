// Integration tests (separate TEST database only, see orders.integration.test.ts):
// accounts, one-time tokens, roles, order isolation between customers, order status changes,
// catalog snapshot in orders, sold-out dishes and the competitor price import.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";

const url = process.env.TEST_DATABASE_URL ?? "";
const usable = /test/i.test(new URL(url || "mongodb://x/none").pathname);

describe("accounts, roles, isolation (integration, test database)", { skip: usable ? false : "TEST_DATABASE_URL (a *test* database) is not set" }, () => {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";

  let accounts: typeof import("@/services/accounts");
  let customer: typeof import("@/services/customer");
  let orders: typeof import("@/services/orders");
  let market: typeof import("@/services/market");
  let rl: typeof import("@/lib/rate-limit");
  let prisma: typeof import("@/lib/prisma").prisma;
  const email = () => `t-${randomUUID().slice(0, 8)}@example.com`;
  let product: { id: string; price: number; name: string; slug: string };

  before(async () => {
    accounts = await import("@/services/accounts");
    customer = await import("@/services/customer");
    orders = await import("@/services/orders");
    market = await import("@/services/market");
    rl = await import("@/lib/rate-limit");
    prisma = (await import("@/lib/prisma")).prisma;
    const p = await prisma.product.findFirst({ where: { active: true, price: { gte: 3000 } }, select: { id: true, price: true, name: true, slug: true } });
    assert.ok(p);
    product = p;
  });
  after(() => prisma.$disconnect());

  const orderData = (over: Record<string, unknown> = {}) =>
    ({
      customerName: "Test Client",
      customerPhone: `07${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      customerEmail: "test@example.com",
      deliveryMethod: "DELIVERY",
      deliveryAddress: "Str. Test 1, ap. 2",
      locationId: "",
      paymentMethod: "CASH",
      notes: "",
      items: [{ productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price }],
      ...over,
    }) as Parameters<typeof orders.createOrder>[0];

  test("registration: stored hashed, e-mail unique (case-insensitive)", async () => {
    const e = email();
    const user = await accounts.registerCustomer({ name: "Ana", email: e.toUpperCase(), password: "parola123" });
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, passwordHash: true, role: true } });
    assert.equal(row?.email, e);
    assert.equal(row?.role, "CUSTOMER");
    assert.ok(row?.passwordHash && row.passwordHash !== "parola123" && row.passwordHash.startsWith("$2"));
    await assert.rejects(accounts.registerCustomer({ name: "Ana 2", email: e, password: "parola123" }), { code: "emailTaken" });
  });

  test("sign-in: right password only, blocked users refused, role filter", async () => {
    const e = email();
    const user = await accounts.registerCustomer({ name: "Ion", email: e, password: "parola123" });
    assert.ok(await accounts.authenticate(e, "parola123"));
    assert.equal(await accounts.authenticate(e, "gresit123"), null);
    assert.equal(await accounts.authenticate("nobody-" + e, "parola123"), null);
    assert.equal(await accounts.authenticate(e, "parola123", ["ADMIN"]), null, "a customer cannot use the staff sign-in");
    await prisma.user.update({ where: { id: user.id }, data: { blockedAt: new Date() } });
    assert.equal(await accounts.authenticate(e, "parola123"), null);
  });

  test("password reset token: single use, expires, revokes sessions", async () => {
    const e = email();
    const user = await accounts.registerCustomer({ name: "Reset", email: e, password: "parola123" });
    const token = await accounts.issueToken(user.id, "PASSWORD_RESET");
    const stored = await prisma.authToken.findFirst({ where: { userId: user.id }, select: { tokenHash: true } });
    assert.notEqual(stored?.tokenHash, token, "only the hash is stored");
    const updated = await accounts.resetPasswordWithToken(token, "nouaParola9");
    assert.equal(updated.sessionVersion, 1, "all older sessions revoked");
    assert.ok(await accounts.authenticate(e, "nouaParola9"));
    assert.equal(await accounts.authenticate(e, "parola123"), null);
    await assert.rejects(accounts.resetPasswordWithToken(token, "altaParola9"), { code: "invalidToken" }, "second use refused");

    const expired = await accounts.issueToken(user.id, "PASSWORD_RESET", Date.now() - 2 * 60 * 60 * 1000);
    await assert.rejects(accounts.consumeToken(expired, "PASSWORD_RESET"), { code: "invalidToken" });
    const newer = await accounts.issueToken(user.id, "PASSWORD_RESET");
    const older = await accounts.issueToken(user.id, "PASSWORD_RESET");
    await assert.rejects(accounts.consumeToken(newer, "PASSWORD_RESET"), { code: "invalidToken" }, "issuing a new token revokes the previous one");
    await accounts.consumeToken(older, "PASSWORD_RESET");
  });

  test("a token used twice in parallel succeeds once", async () => {
    const user = await accounts.registerCustomer({ name: "Race", email: email(), password: "parola123" });
    const token = await accounts.issueToken(user.id, "EMAIL_VERIFY");
    const results = await Promise.allSettled([accounts.verifyEmailWithToken(token), accounts.verifyEmailWithToken(token)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  });

  test("password change needs the current password and bumps the session version", async () => {
    const user = await accounts.registerCustomer({ name: "Pw", email: email(), password: "parola123" });
    await assert.rejects(accounts.changePassword(user.id, "gresit123", "nouaParola9"), { code: "wrongPassword" });
    assert.equal(await accounts.changePassword(user.id, "parola123", "nouaParola9"), 1);
  });

  test("roles: no self-change, the last active admin cannot be demoted or blocked", async () => {
    const a = await accounts.registerCustomer({ name: "Admin A", email: email(), password: "parola123" });
    const b = await accounts.registerCustomer({ name: "Admin B", email: email(), password: "parola123" });
    // Isolate: demote every other admin for this test, restore afterwards.
    const others = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.user.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { role: "CUSTOMER" } });
    try {
      await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
      const actorA = { id: a.id, email: "a@test" };
      await assert.rejects(accounts.setUserRole(actorA, a.id, "CUSTOMER"), { code: "self" });
      await accounts.setUserRole(actorA, b.id, "ADMIN");
      const actorB = { id: b.id, email: "b@test" };
      await accounts.setUserRole(actorB, a.id, "CUSTOMER"); // B stays the only admin
      await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
      await accounts.setUserBlocked(actorA, b.id, true); // B blocked → A is the last active admin
      await assert.rejects(accounts.setUserRole(actorB, a.id, "CUSTOMER"), { code: "lastAdmin" });
      await assert.rejects(accounts.setUserBlocked(actorB, a.id, true), { code: "lastAdmin" });
      const bRow = await prisma.user.findUnique({ where: { id: b.id }, select: { sessionVersion: true } });
      assert.ok((bRow?.sessionVersion ?? 0) >= 1, "blocking revokes sessions");
    } finally {
      await prisma.user.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { role: "ADMIN" } });
    }
  });

  test("customers only see their own orders", async () => {
    const alice = await accounts.registerCustomer({ name: "Alice", email: email(), password: "parola123" });
    const bob = await accounts.registerCustomer({ name: "Bob", email: email(), password: "parola123" });
    const store = rl.createMemoryRateLimitStore();
    const mine = await orders.createOrder(orderData(), { userId: alice.id, rateLimitStore: store });
    const guest = await orders.createOrder(orderData(), { rateLimitStore: store });
    assert.deepEqual((await customer.listUserOrders(alice.id)).map((o) => o.number), [mine.number]);
    assert.equal((await customer.listUserOrders(bob.id)).length, 0);
    assert.ok(await customer.getUserOrder(alice.id, mine.number));
    assert.equal(await customer.getUserOrder(bob.id, mine.number), null, "Bob cannot open Alice's order by number");
    assert.equal(await customer.getUserOrder(alice.id, guest.number), null, "a guest order is not attached by e-mail");
  });

  test("addresses and favourites are scoped to their owner", async () => {
    const a = await accounts.registerCustomer({ name: "A", email: email(), password: "parola123" });
    const b = await accounts.registerCustomer({ name: "B", email: email(), password: "parola123" });
    await customer.addAddress(a.id, { label: "Acasă", address: "Str. Test 1, ap. 2" });
    const [addr] = await customer.listAddresses(a.id);
    assert.equal(await customer.deleteAddress(b.id, addr.id), false, "B cannot delete A's address");
    assert.equal(await customer.deleteAddress(a.id, addr.id), true);
    assert.equal(await customer.toggleFavorite(a.id, product.id), true);
    assert.equal(await customer.isFavorite(b.id, product.id), false);
    assert.equal(await customer.toggleFavorite(a.id, product.id), false);
  });

  test("order status: allowed steps only, compare-and-set, audited", async () => {
    const o = await orders.createOrder(orderData(), { rateLimitStore: rl.createMemoryRateLimitStore() });
    const actor = { id: "0123456789abcdef01234567", email: "admin@test" };
    await assert.rejects(orders.changeOrderStatus(actor, o.id, "COMPLETED"), { code: "notAllowed" });
    await orders.changeOrderStatus(actor, o.id, "CONFIRMED");
    const both = await Promise.allSettled([orders.changeOrderStatus(actor, o.id, "PREPARING"), orders.changeOrderStatus(actor, o.id, "CANCELLED")]);
    assert.equal(both.filter((r) => r.status === "fulfilled").length, 1, "two admins at once: one wins");
    const log = await prisma.auditLog.findMany({ where: { entity: "order", entityId: o.id } });
    assert.equal(log.length, 2);
  });

  test("old orders keep their snapshot when the catalog changes", async () => {
    const o = await orders.createOrder(orderData(), { rateLimitStore: rl.createMemoryRateLimitStore() });
    await prisma.product.update({ where: { id: product.id }, data: { name: "Renamed", price: product.price + 1000 } });
    try {
      const saved = await prisma.order.findUnique({ where: { id: o.id }, include: { items: true } });
      assert.equal(saved?.items[0].productName, product.name);
      assert.equal(saved?.items[0].price, product.price);
    } finally {
      await prisma.product.update({ where: { id: product.id }, data: { name: product.name, price: product.price } });
    }
  });

  test("a sold-out dish cannot be ordered", async () => {
    await prisma.product.update({ where: { id: product.id }, data: { soldOut: true } });
    try {
      await assert.rejects(orders.createOrder(orderData(), { rateLimitStore: rl.createMemoryRateLimitStore() }), (e: unknown) => {
        assert.ok(e instanceof orders.OrderError);
        assert.deepEqual(e.detail.unavailable, [{ productId: product.id }]);
        return true;
      });
    } finally {
      await prisma.product.update({ where: { id: product.id }, data: { soldOut: false } });
    }
  });

  test("favourites kept in the browser join the account: only real products, no duplicates, other accounts untouched", async () => {
    const a = await accounts.registerCustomer({ name: "Merge A", email: email(), password: "Parola1234" });
    const b = await accounts.registerCustomer({ name: "Merge B", email: email(), password: "Parola1234" });
    const another = await prisma.product.findFirst({ where: { id: { not: product.id } }, select: { id: true } });
    assert.ok(another);
    const ghost = "a".repeat(24); // well-formed id of a product that does not exist
    assert.equal(await customer.toggleFavorite(a.id, product.id), true); // already a favourite in the account
    const added = await customer.mergeFavorites(a.id, [product.id, another.id, another.id, ghost, "not-an-id", "<script>"]);
    assert.equal(added, 1); // only the new, real one
    assert.deepEqual((await customer.listFavoriteIds(a.id)).sort(), [product.id, another.id].sort());
    assert.equal(await customer.mergeFavorites(a.id, [another.id]), 0); // a repeat adds nothing
    assert.deepEqual(await customer.listFavoriteIds(b.id), []);
    assert.equal(await customer.mergeFavorites(b.id, []), 0);
    // A long list is cut to the per-request limit instead of being trusted.
    const many = Array.from({ length: customer.MAX_FAVORITES_PER_MERGE + 50 }, (_, i) => i.toString(16).padStart(24, "b"));
    assert.equal(await customer.mergeFavorites(b.id, many), 0); // none of them exists
  });

  test("dashboard: demo/real filter treats orders without the flag as real", async () => {
    const store = rl.createMemoryRateLimitStore();
    const real = await orders.createOrder(orderData(), { rateLimitStore: store });
    const demo = await orders.createOrder(orderData(), { rateLimitStore: store, demo: true });
    const realList = (await orders.listOrders({ kind: "real" }, 500)).map((o) => o.number);
    const demoList = (await orders.listOrders({ kind: "demo" }, 500)).map((o) => o.number);
    assert.ok(realList.includes(real.number) && !realList.includes(demo.number));
    assert.ok(demoList.includes(demo.number) && !demoList.includes(real.number));
  });

  test("competitor CSV: all-or-nothing validation, duplicates skipped, benchmark needs 2 offers", async () => {
    const actor = { id: "0123456789abcdef01234567", email: "admin@test" };
    const header = market.CSV_COLUMNS.join(",");
    const bad = `${header}\nX,Item,Burgeri,abc,,SINGLE,RESTAURANT_SITE,https://x.md/,2026-10-12,,${product.slug}\n`;
    const before = await prisma.competitorPrice.count();
    const r1 = await market.importCompetitorCsv(actor, bad);
    assert.ok(r1.errors.length > 0);
    assert.equal(await prisma.competitorPrice.count(), before, "nothing imported");
    const tag = randomUUID().slice(0, 6);
    const good = `${header}\nR1-${tag},Item,Burgeri,100.00,300 g,SINGLE,RESTAURANT_SITE,https://a.md/,2026-10-12,,${product.slug}\nR2-${tag},Item,Burgeri,120.00,300 g,SINGLE,AGGREGATOR,https://b.md/,2026-10-12,,${product.slug}\n`;
    assert.deepEqual(await market.importCompetitorCsv(actor, good), { errors: [], created: 2, skipped: 0 });
    assert.deepEqual(await market.importCompetitorCsv(actor, good), { errors: [], created: 0, skipped: 2 });
    const row = (await market.marketOverview()).find((p) => p.id === product.id);
    assert.ok(row && row.offers.length >= 2 && row.benchmark !== null);
    await prisma.competitorPrice.deleteMany({ where: { restaurant: { in: [`R1-${tag}`, `R2-${tag}`] } } });
  });

  test("price change from the market page refuses a stale confirmation", async () => {
    const actor = { id: "0123456789abcdef01234567", email: "admin@test" };
    const stale = await market.setProductPriceConfirmed(actor, product.id, product.price + 1, product.price + 500);
    assert.ok("error" in stale);
    const ok = await market.setProductPriceConfirmed(actor, product.id, product.price, product.price + 500);
    assert.ok(!("error" in ok));
    await prisma.product.update({ where: { id: product.id }, data: { price: product.price } });
  });
});
