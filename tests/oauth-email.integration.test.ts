// Google accounts, account linking, e-mail change, account e-mails and order e-mails against the
// TEST database only (TEST_DATABASE_URL, name containing "test"). No real e-mail is sent: every
// send goes to a recording stub, and rate limits use an in-memory store.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";

const url = process.env.TEST_DATABASE_URL ?? "";
const usable = /test/i.test(new URL(url || "mongodb://x/none").pathname);

type Message = { to: string; subject: string; text: string; html: string };

/** Recording stand-in for sendMail; answers with `result` (or throws). */
function mailbox(result: { ok: true } | { ok: false; reason: string } | "throw" = { ok: true }) {
  const sent: Message[] = [];
  const send = async (m: Message) => {
    if (result === "throw") throw new Error("smtp exploded");
    sent.push(m);
    return result;
  };
  return { sent, send };
}

describe("Google sign-in, linking and e-mails (integration, test database)", { skip: usable ? false : "TEST_DATABASE_URL (a *test* database) is not set" }, () => {
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";

  let accounts: typeof import("@/services/accounts");
  let oauth: typeof import("@/services/oauth");
  let accountEmails: typeof import("@/services/account-emails");
  let orderEmails: typeof import("@/services/order-emails");
  let orders: typeof import("@/services/orders");
  let telegram: typeof import("@/services/order-notifications");
  let rl: typeof import("@/lib/rate-limit");
  let prisma: typeof import("@/lib/prisma").prisma;
  let product: { id: string; price: number };
  const users: string[] = [];
  const PASSWORD = "Parola123qa";
  const actor = { id: "665f000000000000000000aa", email: "qa-actor@example.com" };

  before(async () => {
    accounts = await import("@/services/accounts");
    oauth = await import("@/services/oauth");
    accountEmails = await import("@/services/account-emails");
    orderEmails = await import("@/services/order-emails");
    orders = await import("@/services/orders");
    telegram = await import("@/services/order-notifications");
    rl = await import("@/lib/rate-limit");
    prisma = (await import("@/lib/prisma")).prisma;
    const p = await prisma.product.findFirst({ where: { active: true, price: { gte: 3000 } }, select: { id: true, price: true } });
    assert.ok(p);
    product = p;
  });
  after(async () => {
    await prisma.oAuthAccount.deleteMany({ where: { userId: { in: users } } });
    await prisma.authToken.deleteMany({ where: { userId: { in: users } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  });

  const uid = () => randomUUID().slice(0, 8);
  const profile = (over: Partial<{ sub: string; email: string; name: string }> = {}) => ({ sub: `g-${uid()}`, email: `g-${uid()}@example.com`, name: "Google User", ...over });
  async function customer(over: Record<string, unknown> = {}) {
    const email = `c-${uid()}@example.com`;
    const u = await prisma.user.create({
      data: { name: "Client", email, role: "CUSTOMER", passwordHash: await accounts.hashPassword(PASSWORD), sessionVersion: 0, ...over },
      select: { id: true, email: true },
    });
    users.push(u.id);
    return u;
  }
  const track = async <T extends { kind: string; userId?: string }>(r: T) => {
    if (r.userId) users.push(r.userId);
    return r;
  };

  // ───────── Google sign-in ─────────

  test("a new Google account creates one verified CUSTOMER without a password", async () => {
    const p = profile();
    const r = await track(await oauth.signInWithGoogle(p));
    assert.equal(r.kind, "created");
    assert.ok(r.kind === "created");
    assert.equal(r.role, "CUSTOMER");
    assert.equal(r.sessionVersion, 0);
    const u = await prisma.user.findUnique({ where: { id: r.userId }, select: { email: true, role: true, passwordHash: true, emailVerifiedAt: true } });
    assert.equal(u?.email, p.email);
    assert.equal(u?.role, "CUSTOMER");
    assert.equal(u?.passwordHash, null);
    assert.ok(u?.emailVerifiedAt);
    const link = await prisma.oAuthAccount.findMany({ where: { userId: r.userId } });
    assert.equal(link.length, 1);
    assert.equal(link[0]?.providerAccountId, p.sub);

    const again = await oauth.signInWithGoogle(p);
    assert.equal(again.kind, "signedIn");
    assert.ok(again.kind === "signedIn" && again.userId === r.userId, "same user, no duplicate");
    assert.equal(await prisma.user.count({ where: { email: p.email } }), 1);
  });

  test("the account is found by Google's id, not by e-mail (Google e-mail changed)", async () => {
    const p = profile();
    const r = await track(await oauth.signInWithGoogle(p));
    const changed = await oauth.signInWithGoogle({ ...p, email: `renamed-${uid()}@example.com` });
    assert.ok(changed.kind === "signedIn" && r.kind === "created" && changed.userId === r.userId);
  });

  test("parallel first sign-ins with the same Google account create one user", async () => {
    const p = profile();
    const results = await Promise.all([oauth.signInWithGoogle(p), oauth.signInWithGoogle(p), oauth.signInWithGoogle(p)]);
    for (const r of results) await track(r);
    assert.equal(await prisma.user.count({ where: { email: p.email } }), 1);
    assert.equal(await prisma.oAuthAccount.count({ where: { providerAccountId: p.sub } }), 1);
    const ids = new Set(results.filter((r) => r.kind === "created" || r.kind === "signedIn").map((r) => (r as { userId: string }).userId));
    assert.ok(ids.size <= 1);
  });

  test("an existing e-mail is NOT linked automatically", async () => {
    const existing = await customer();
    const r = await oauth.signInWithGoogle(profile({ email: existing.email }));
    assert.deepEqual(r, { kind: "emailExists" });
    assert.equal(await prisma.oAuthAccount.count({ where: { userId: existing.id } }), 0);
    assert.equal(await prisma.user.count({ where: { email: existing.email } }), 1);
  });

  test("Google never grants or uses administrator rights; blocked accounts are refused", async () => {
    const p = profile();
    const r = await track(await oauth.signInWithGoogle(p));
    assert.ok(r.kind === "created");
    await accounts.setUserRole(actor, r.userId, "ADMIN");
    assert.deepEqual(await oauth.signInWithGoogle(p), { kind: "notAllowed" }, "administrators sign in with the password only");
    await accounts.setUserRole(actor, r.userId, "CUSTOMER");
    await accounts.setUserBlocked(actor, r.userId, true);
    assert.deepEqual(await oauth.signInWithGoogle(p), { kind: "notAllowed" });
  });

  test("Google sign-in carries the current session version (revocations keep working)", async () => {
    const p = profile();
    const r = await track(await oauth.signInWithGoogle(p));
    assert.ok(r.kind === "created");
    await accounts.bumpSessionVersion(r.userId);
    await accounts.bumpSessionVersion(r.userId);
    const again = await oauth.signInWithGoogle(p);
    assert.ok(again.kind === "signedIn" && again.sessionVersion === 2);
  });

  // ───────── Linking ─────────

  test("linking: once, not to two accounts, one Google account per user, never for admins", async () => {
    const a = await customer();
    const b = await customer();
    const p = profile();
    assert.equal(await oauth.linkGoogleAccount(a.id, p), "linked");
    assert.equal(await oauth.linkGoogleAccount(a.id, p), "alreadyLinked");
    assert.equal(await oauth.linkGoogleAccount(b.id, p), "linkedElsewhere");
    assert.equal(await oauth.linkGoogleAccount(a.id, profile()), "hasOther");
    const signedIn = await oauth.signInWithGoogle(p);
    assert.ok(signedIn.kind === "signedIn" && signedIn.userId === a.id, "the linked account signs in with Google");
    const admin = await customer({ role: "ADMIN" });
    assert.equal(await oauth.linkGoogleAccount(admin.id, profile()), "notAllowed");
    assert.equal((await prisma.user.findUnique({ where: { id: a.id }, select: { role: true } }))?.role, "CUSTOMER", "role unchanged");
  });

  test("re-authentication for linking checks the account password", async () => {
    const a = await customer();
    assert.equal(await accounts.verifyPassword(a.id, PASSWORD), true);
    assert.equal(await accounts.verifyPassword(a.id, "wrong-password-1"), false);
    const g = await track(await oauth.signInWithGoogle(profile()));
    assert.ok(g.kind === "created");
    assert.equal(await accounts.verifyPassword(g.userId, ""), false, "no password, no re-authentication");
  });

  test("unlinking is refused while the account has no password", async () => {
    const g = await track(await oauth.signInWithGoogle(profile()));
    assert.ok(g.kind === "created");
    assert.equal(await oauth.unlinkGoogleAccount(g.userId), "needsPassword");
    const a = await customer();
    await oauth.linkGoogleAccount(a.id, profile());
    assert.equal(await oauth.unlinkGoogleAccount(a.id), "unlinked");
    assert.equal(await oauth.googleAccountOf(a.id), null);
  });

  // ───────── E-mail change ─────────

  test("e-mail change: password required, link to the new address, single use, old links void", async () => {
    const a = await customer();
    const store = rl.createMemoryRateLimitStore();
    const box = mailbox();
    await assert.rejects(accountEmails.startEmailChange(a, "new@example.com", "wrong-pass-1", "ru", { send: box.send, store }), { code: "wrongPassword" });
    await assert.rejects(accountEmails.startEmailChange(a, a.email.toUpperCase(), PASSWORD, "ru", { send: box.send, store }), { code: "sameEmail" });

    const reset = await accounts.issueToken(a.id, "PASSWORD_RESET"); // sent earlier to the old address
    const newEmail = `new-${uid()}@example.com`;
    const started = await accountEmails.startEmailChange(a, newEmail, PASSWORD, "ru", { send: box.send, store });
    assert.equal(started.kind, "accepted");
    assert.ok(started.kind === "accepted" && (await started.deliver()));
    assert.deepEqual(box.sent.map((m) => m.to), [newEmail, a.email], "link to the new address, notice to the old one");
    const token = /confirm-email\?token=([A-Za-z0-9_-]+)/.exec(box.sent[0]!.text)?.[1];
    assert.ok(token);
    assert.ok(!box.sent[1]!.text.includes(token), "the old address never sees the link");
    const stored = await prisma.authToken.findFirst({ where: { userId: a.id, type: "EMAIL_CHANGE" }, select: { tokenHash: true, newEmail: true } });
    assert.notEqual(stored?.tokenHash, token, "only the hash is stored");
    assert.equal(stored?.newEmail, newEmail);
    assert.equal((await prisma.user.findUnique({ where: { id: a.id }, select: { email: true } }))?.email, a.email, "nothing changes before confirmation");

    const done = await accounts.confirmEmailChange(token);
    assert.equal(done.email, newEmail);
    const after = await prisma.user.findUnique({ where: { id: a.id }, select: { email: true, emailVerifiedAt: true, sessionVersion: true } });
    assert.equal(after?.email, newEmail);
    assert.ok(after?.emailVerifiedAt);
    assert.equal(after?.sessionVersion, 0, "session version untouched");
    await assert.rejects(accounts.confirmEmailChange(token), { code: "invalidToken" }, "single use");
    await assert.rejects(accounts.consumeToken(reset, "PASSWORD_RESET"), { code: "invalidToken" }, "links sent to the old address are void");
    assert.ok(await accounts.authenticate(newEmail, PASSWORD), "signs in with the new address");
  });

  test("e-mail change to a taken address: same answer, nothing sent, nothing changed", async () => {
    const a = await customer();
    const b = await customer();
    const box = mailbox();
    const started = await accountEmails.startEmailChange(a, b.email, PASSWORD, "ro", { send: box.send, store: rl.createMemoryRateLimitStore() });
    assert.equal(started.kind, "accepted");
    assert.ok(started.kind === "accepted");
    assert.equal(await started.deliver(), false);
    assert.equal(box.sent.length, 0);
  });

  test("e-mail change: expired link refused; address taken meanwhile refused", async () => {
    const a = await customer();
    const expired = await accounts.issueToken(a.id, "EMAIL_CHANGE", Date.now() - 2 * 60 * 60 * 1000, `x-${uid()}@example.com`);
    await assert.rejects(accounts.confirmEmailChange(expired), { code: "invalidToken" });
    const b = await customer();
    const token = await accounts.issueToken(a.id, "EMAIL_CHANGE", Date.now(), b.email);
    await assert.rejects(accounts.confirmEmailChange(token), { code: "emailTaken" });
    assert.equal((await prisma.user.findUnique({ where: { id: a.id }, select: { email: true } }))?.email, a.email);
  });

  test("e-mail change requests are rate limited", async () => {
    const a = await customer();
    const store = rl.createMemoryRateLimitStore();
    const send = mailbox().send;
    for (let i = 0; i < 3; i++) assert.equal((await accountEmails.startEmailChange(a, `n${i}-${uid()}@example.com`, PASSWORD, "en", { send, store })).kind, "accepted");
    assert.equal((await accountEmails.startEmailChange(a, `n4-${uid()}@example.com`, PASSWORD, "en", { send, store })).kind, "limited");
  });

  // ───────── Confirmation and password reset e-mails ─────────

  test("verification e-mail: one-time link; resending is limited (1/min, 3/h)", async () => {
    const a = await customer();
    const store = rl.createMemoryRateLimitStore();
    const box = mailbox();
    const user = { id: a.id, email: a.email, emailVerified: false };
    assert.equal((await accountEmails.resendVerification(user, "ru", { send: box.send, store })).kind, "sent");
    const second = await accountEmails.resendVerification(user, "ru", { send: box.send, store });
    assert.equal(second.kind, "limited");
    assert.ok(second.kind === "limited" && second.retryAfterSeconds <= 60);
    assert.equal(box.sent.length, 1);
    const token = /verify\?token=([A-Za-z0-9_-]+)/.exec(box.sent[0]!.text)?.[1];
    assert.ok(token);
    await accounts.verifyEmailWithToken(token);
    await assert.rejects(accounts.verifyEmailWithToken(token), { code: "invalidToken" }, "single use");
    assert.equal((await accountEmails.resendVerification({ ...user, emailVerified: true }, "ru", { send: box.send, store })).kind, "verified");
    const expired = await accounts.issueToken(a.id, "EMAIL_VERIFY", Date.now() - 49 * 60 * 60 * 1000);
    await assert.rejects(accounts.verifyEmailWithToken(expired), { code: "invalidToken" }, "expired");
  });

  test("password reset: same answer for unknown addresses, e-mail only to real accounts, no password in it", async () => {
    const a = await customer();
    const store = rl.createMemoryRateLimitStore();
    const box = mailbox();
    const known = await accountEmails.requestPasswordReset(a.email, "en", "198.51.100.7", { send: box.send, store });
    const unknown = await accountEmails.requestPasswordReset(`nobody-${uid()}@example.com`, "en", "198.51.100.7", { send: box.send, store });
    assert.equal(known.kind, "accepted");
    assert.equal(unknown.kind, "accepted", "the same answer");
    assert.ok(known.kind === "accepted" && unknown.kind === "accepted");
    assert.equal(await unknown.deliver(), false);
    assert.equal(await known.deliver(), true);
    assert.deepEqual(box.sent.map((m) => m.to), [a.email]);
    assert.ok(!box.sent[0]!.text.includes(PASSWORD) && !box.sent[0]!.html.includes(PASSWORD));
    const token = /reset\?token=([A-Za-z0-9_-]+)/.exec(box.sent[0]!.text)?.[1];
    assert.ok(token);
    await accounts.resetPasswordWithToken(token, "NouaParola789");
    await assert.rejects(accounts.resetPasswordWithToken(token, "AltaParola789"), { code: "invalidToken" });
  });

  test("password reset is rate limited per address", async () => {
    const a = await customer();
    const store = rl.createMemoryRateLimitStore();
    const send = mailbox().send;
    for (let i = 0; i < 3; i++) assert.equal((await accountEmails.requestPasswordReset(a.email, "ro", null, { send, store })).kind, "accepted");
    assert.equal((await accountEmails.requestPasswordReset(a.email, "ro", null, { send, store })).kind, "limited");
  });

  test("a failing mail server is reported, never thrown", async () => {
    const a = await customer();
    const down = mailbox({ ok: false, reason: "EAUTH 535" });
    const r = await accountEmails.requestPasswordReset(a.email, "ro", null, { send: down.send, store: rl.createMemoryRateLimitStore() });
    assert.ok(r.kind === "accepted");
    assert.equal(await r.deliver(), false);
    const boom = mailbox("throw");
    assert.equal(await accountEmails.sendVerificationEmail(a.id, a.email, "ro", boom.send), false);
    const failed = await accountEmails.resendVerification({ id: a.id, email: a.email, emailVerified: false }, "ro", { send: down.send, store: rl.createMemoryRateLimitStore() });
    assert.equal(failed.kind, "failed");
  });

  // ───────── Order e-mails ─────────

  const orderData = (email = "client@example.com") =>
    ({
      customerName: "Mail Test",
      customerPhone: `07${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      customerEmail: email,
      deliveryMethod: "DELIVERY",
      deliveryAddress: "Str. Test 1",
      locationId: "",
      paymentMethod: "CASH",
      notes: "",
      items: [{ productId: product.id, quantity: 1, optionIds: [], unitPrice: product.price }],
    }) as Parameters<typeof orders.createOrder>[0];
  const place = (email?: string, locale = "en", demo = false) =>
    orders.createOrder(orderData(email), { idempotencyKey: randomUUID(), rateLimitStore: rl.createMemoryRateLimitStore(), locale, demo });
  const adminAddress = () => orderEmails.adminNotifyEmail({});
  const marks = (id: string) =>
    prisma.order.findUnique({ where: { id }, select: { customerEmailedAt: true, adminEmailedAt: true, emailedStatus: true, telegramNotifiedAt: true } });

  test("new order: one e-mail to the customer (in the checkout language) and one to the owner, never twice", async () => {
    const order = await place("client@example.com", "ru");
    const box = mailbox();
    const first = await orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com");
    assert.deepEqual(first, { customer: "sent", admin: "sent" });
    assert.deepEqual(box.sent.map((m) => m.to).sort(), ["client@example.com", "owner@example.com"]);
    assert.ok(box.sent.find((m) => m.to === "client@example.com")!.subject.includes("принят"));
    const again = await Promise.all([orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com"), orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com")]);
    assert.deepEqual(again, [
      { customer: "skipped", admin: "skipped" },
      { customer: "skipped", admin: "skipped" },
    ]);
    assert.equal(box.sent.length, 2);
  });

  test("parallel first calls still send each e-mail once", async () => {
    const order = await place();
    const box = mailbox();
    await Promise.all(Array.from({ length: 4 }, () => orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com")));
    assert.equal(box.sent.length, 2);
  });

  test("a failed send keeps the order and can be retried; no owner address, no owner e-mail", async () => {
    const order = await place();
    const down = mailbox({ ok: false, reason: "ETIMEDOUT" });
    assert.deepEqual(await orderEmails.sendNewOrderEmails(order.id, down.send, null), { customer: "failed", admin: "skipped" });
    assert.ok(await prisma.order.findUnique({ where: { id: order.id }, select: { id: true } }), "order still saved");
    const boom = mailbox("throw");
    assert.equal((await orderEmails.sendNewOrderEmails(order.id, boom.send, null)).customer, "failed");
    const box = mailbox();
    assert.equal((await orderEmails.sendNewOrderEmails(order.id, box.send, null)).customer, "sent", "retry after failure");
  });

  test("no customer e-mail for an invalid stored address", async () => {
    const order = await place();
    await prisma.order.update({ where: { id: order.id }, data: { customerEmail: "not-an-address" } });
    const box = mailbox();
    assert.deepEqual(await orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com"), { customer: "skipped", admin: "sent" });
    assert.deepEqual(box.sent.map((m) => m.to), ["owner@example.com"]);
  });

  test("status e-mails: only significant statuses, once each, only while current", async () => {
    const order = await place("client@example.com", "ro");
    const box = mailbox();
    await orders.changeOrderStatus(actor, order.id, "CONFIRMED");
    assert.equal(await orderEmails.sendOrderStatusEmail(order.id, "CONFIRMED", box.send), "sent");
    assert.equal(await orderEmails.sendOrderStatusEmail(order.id, "CONFIRMED", box.send), "skipped", "not twice");
    await orders.changeOrderStatus(actor, order.id, "PREPARING");
    assert.equal(await orderEmails.sendOrderStatusEmail(order.id, "PREPARING", box.send), "skipped", "minor step");
    assert.equal(await orderEmails.sendOrderStatusEmail(order.id, "CONFIRMED", box.send), "skipped", "stale status");
    await orders.changeOrderStatus(actor, order.id, "OUT_FOR_DELIVERY");
    const down = mailbox({ ok: false, reason: "EAUTH 535" });
    assert.equal(await orderEmails.sendOrderStatusEmail(order.id, "OUT_FOR_DELIVERY", down.send), "failed");
    const parallel = await Promise.all([orderEmails.sendOrderStatusEmail(order.id, "OUT_FOR_DELIVERY", box.send), orderEmails.sendOrderStatusEmail(order.id, "OUT_FOR_DELIVERY", box.send)]);
    assert.deepEqual(parallel.sort(), ["sent", "skipped"], "retry after failure, once");
    assert.equal(box.sent.length, 2);
    assert.ok(box.sent[1]!.subject.includes(order.number));
  });

  // ───────── Demo mode, owner e-mail, Telegram ─────────

  test("demo order: no customer e-mail and no mark left behind; the owner e-mail says DEMO", async () => {
    const order = await place("client@example.com", "ru", true);
    const box = mailbox();
    assert.deepEqual(await orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com"), { customer: "skipped", admin: "sent" });
    assert.deepEqual(box.sent.map((m) => m.to), ["owner@example.com"]);
    assert.ok(box.sent[0]!.subject.startsWith("[демо]") && box.sent[0]!.text.includes("ДЕМО-ЗАКАЗ"));
    const m = await marks(order.id);
    assert.equal(m?.customerEmailedAt ?? null, null, "nothing recorded for the customer e-mail");
    assert.ok(m?.adminEmailedAt);
  });

  test("demo order: no status e-mails, and no status mark is written", async () => {
    const order = await place("client@example.com", "en", true);
    const box = mailbox();
    for (const status of ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "CANCELLED"] as const) {
      await orders.changeOrderStatus(actor, order.id, status);
      assert.equal(await orderEmails.sendOrderStatusEmail(order.id, status, box.send), "skipped");
    }
    assert.equal(box.sent.length, 0);
    assert.equal((await marks(order.id))?.emailedStatus ?? null, null);
  });

  test("switching to live mode sends nothing for old demo orders, while new live orders are e-mailed", async () => {
    const demoOrder = await place("client@example.com", "ro", true);
    const box = mailbox();
    await orderEmails.sendNewOrderEmails(demoOrder.id, box.send, null);
    // Later, with ORDER_MODE=live: the old order is still a demo order and stays silent.
    assert.deepEqual(await orderEmails.sendNewOrderEmails(demoOrder.id, box.send, null), { customer: "skipped", admin: "skipped" });
    await orders.changeOrderStatus(actor, demoOrder.id, "CONFIRMED");
    assert.equal(await orderEmails.sendOrderStatusEmail(demoOrder.id, "CONFIRMED", box.send), "skipped");
    assert.equal(box.sent.length, 0);
    const liveOrder = await place("client@example.com", "ro", false);
    assert.equal((await orderEmails.sendNewOrderEmails(liveOrder.id, box.send, null)).customer, "sent");
    await orders.changeOrderStatus(actor, liveOrder.id, "CONFIRMED");
    assert.equal(await orderEmails.sendOrderStatusEmail(liveOrder.id, "CONFIRMED", box.send), "sent");
    assert.equal(box.sent.length, 2);
  });

  test("owner e-mail: skipped without an address, retried once after a Gmail failure, never duplicated", async () => {
    const order = await place();
    const box = mailbox();
    assert.equal((await orderEmails.sendNewOrderEmails(order.id, box.send, null)).admin, "skipped");
    assert.equal((await marks(order.id))?.adminEmailedAt ?? null, null, "no address: nothing recorded, can be sent later");
    const down = mailbox({ ok: false, reason: "EAUTH 535" });
    assert.equal((await orderEmails.sendNewOrderEmails(order.id, down.send, "owner@example.com")).admin, "failed");
    assert.equal((await marks(order.id))?.adminEmailedAt ?? null, null, "failure releases the claim");
    const results = await Promise.all([1, 2, 3].map(() => orderEmails.sendNewOrderEmails(order.id, box.send, "owner@example.com")));
    assert.deepEqual(results.map((r) => r.admin).sort(), ["sent", "skipped", "skipped"]);
    assert.equal(box.sent.filter((m) => m.to === "owner@example.com").length, 1);
    assert.equal(adminAddress(), null);
  });

  test("Gmail down: the order stays saved and the Telegram message is still sent, once", async () => {
    const order = await place("client@example.com", "en", true);
    const tg: string[] = [];
    const telegramSend = async (html: string) => (tg.push(html), { ok: true as const });
    const smtpDown = mailbox("throw");
    // The checkout runs both after the response, independently; run them together here.
    const [tgResult, mailResult] = await Promise.all([telegram.notifyNewOrder(order.id, telegramSend), orderEmails.sendNewOrderEmails(order.id, smtpDown.send, "owner@example.com")]);
    assert.equal(tgResult, "sent");
    assert.deepEqual(mailResult, { customer: "skipped", admin: "failed" });
    assert.equal(tg.length, 1);
    assert.ok(tg[0]!.includes(order.number) && tg[0]!.includes("Демо-заказ"));
    const saved = await prisma.order.findUnique({ where: { id: order.id }, select: { number: true, telegramNotifiedAt: true } });
    assert.equal(saved?.number, order.number);
    assert.ok(saved?.telegramNotifiedAt);
    assert.equal(await telegram.notifyNewOrder(order.id, telegramSend), "skipped", "Telegram not repeated");
  });

  test("administrators: password sign-in for /admin works, Google sign-in stays refused", async () => {
    const admin = await customer({ role: "ADMIN" });
    const ok = await accounts.authenticate(admin.email, PASSWORD, ["ADMIN"]);
    assert.ok(ok && ok.role === "ADMIN", "the /admin/login check accepts the password");
    assert.equal(await accounts.authenticate(admin.email, "wrong-pass-1", ["ADMIN"]), null);
    const c = await customer();
    assert.equal(await accounts.authenticate(c.email, PASSWORD, ["ADMIN"]), null, "a customer cannot use /admin/login");
    const p = profile({ email: `admin-g-${uid()}@example.com` });
    const g = await track(await oauth.signInWithGoogle(p));
    assert.ok(g.kind === "created");
    await prisma.user.update({ where: { id: g.userId }, data: { role: "ADMIN" } });
    assert.deepEqual(await oauth.signInWithGoogle(p), { kind: "notAllowed" });
    assert.equal(await oauth.linkGoogleAccount(admin.id, profile()), "notAllowed");
    assert.equal((await prisma.user.findUnique({ where: { id: c.id }, select: { role: true } }))?.role, "CUSTOMER");
  });
});
