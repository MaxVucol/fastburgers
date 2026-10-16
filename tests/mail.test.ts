// E-mail layer without any real e-mail: configuration rules, the Gmail SMTP transport with a fake
// Nodemailer transporter, error handling (no secrets in reasons), and the HTML templates.
import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import { gmailSmtpOptions, mailCheckPlan, readMailConfig, safeSmtpReason } from "@/lib/mail-config";
import { createGmailTransport, createResendTransport, type OutgoingMail } from "@/lib/mail-transports";
import { mailEnabled, sendMail, setMailTransportForTests } from "@/lib/mail";
import { adminNewOrderEmail, linkEmail, orderReceivedEmail, orderStatusEmail, type EmailOrder } from "@/lib/email/templates";

const APP_PASSWORD = "abcd efgh ijkl mnop"; // shape of a Gmail app password, not a real one

describe("mail configuration", () => {
  test("Gmail is picked from GMAIL_USER; the app password may contain Google's spaces", () => {
    const c = readMailConfig({ GMAIL_USER: "Shop@Gmail.com", GMAIL_APP_PASSWORD: APP_PASSWORD });
    assert.ok(c.ok);
    assert.equal(c.provider, "gmail");
    assert.equal(c.gmail?.user, "shop@gmail.com");
    assert.equal(c.gmail?.pass, "abcdefghijklmnop");
    assert.equal(c.gmail?.port, 465);
    assert.equal(c.from, "BUNIQ <shop@gmail.com>");
    assert.deepEqual(c.warnings, []);
  });

  test("a normal Google password is refused (must be a 16-letter app password)", () => {
    const c = readMailConfig({ GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: "MyGooglePassword2024!" });
    assert.equal(c.ok, false);
    assert.ok(!c.ok && c.problems.some((p) => p.includes("app password")));
    // The value itself never appears in a problem.
    assert.ok(!c.ok && c.problems.every((p) => !p.includes("MyGooglePassword")));
  });

  test("missing pieces, a bad provider, port and sender are reported by name", () => {
    assert.equal(readMailConfig({}).ok, false);
    assert.equal(readMailConfig({ EMAIL_PROVIDER: "sendgrid" }).ok, false);
    const gmailNoPass = readMailConfig({ EMAIL_PROVIDER: "gmail", GMAIL_USER: "shop@gmail.com" });
    assert.ok(!gmailNoPass.ok && gmailNoPass.problems.some((p) => p.includes("GMAIL_APP_PASSWORD")));
    const badPort = readMailConfig({ GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: APP_PASSWORD, GMAIL_SMTP_PORT: "25" });
    assert.ok(!badPort.ok && badPort.problems.some((p) => p.includes("GMAIL_SMTP_PORT")));
    const badFrom = readMailConfig({ GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: APP_PASSWORD, EMAIL_FROM: "not an address" });
    assert.ok(!badFrom.ok && badFrom.problems.some((p) => p.includes("EMAIL_FROM")));
    const resendNoFrom = readMailConfig({ RESEND_API_KEY: "re_x" });
    assert.ok(!resendNoFrom.ok && resendNoFrom.problems.some((p) => p.includes("EMAIL_FROM")));
  });

  test("port 587 uses STARTTLS; a sender other than GMAIL_USER gives a warning", () => {
    const c = readMailConfig({ GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: APP_PASSWORD, GMAIL_SMTP_PORT: "587", EMAIL_FROM: "BUNIQ <hello@buniq.md>" });
    assert.ok(c.ok);
    assert.equal(c.gmail?.port, 587);
    assert.equal(c.warnings.length, 1);
    const o = gmailSmtpOptions(c.gmail!);
    assert.equal(o.host, "smtp.gmail.com");
    assert.equal(o.secure, false);
    assert.equal(o.requireTLS, true);
    const tls = gmailSmtpOptions({ user: "a@gmail.com", pass: "x", port: 465 });
    assert.equal(tls.secure, true);
    assert.equal(tls.logger, false);
  });

  test("EMAIL_PROVIDER=gmail is honoured and needs the Gmail variables", () => {
    const c = readMailConfig({ EMAIL_PROVIDER: "gmail", GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: APP_PASSWORD, RESEND_API_KEY: "re_x" });
    assert.ok(c.ok && c.provider === "gmail", "explicit gmail wins even if a Resend key is present");
    const missing = readMailConfig({ EMAIL_PROVIDER: "gmail", RESEND_API_KEY: "re_x" });
    assert.equal(missing.ok, false, "no silent fallback to another provider");
  });

  test("mail:check sends nothing unless --send <address> is given", () => {
    assert.deepEqual(mailCheckPlan([]), { sendTo: null });
    assert.deepEqual(mailCheckPlan(["--verbose"]), { sendTo: null });
    assert.deepEqual(mailCheckPlan(["--send", "me@example.com"]), { sendTo: "me@example.com" });
    assert.equal(mailCheckPlan(["--send"]).sendTo, null);
    assert.ok(mailCheckPlan(["--send"]).error);
    assert.equal(mailCheckPlan(["--send", "not-an-address"]).sendTo, null);
  });

  test("Resend with EMAIL_FROM (MAIL_FROM still accepted)", () => {
    const c = readMailConfig({ RESEND_API_KEY: "re_x", MAIL_FROM: "BUNIQ <no-reply@buniq.md>" });
    assert.ok(c.ok);
    assert.equal(c.provider, "resend");
    assert.equal(c.from, "BUNIQ <no-reply@buniq.md>");
  });
});

/** Fake Nodemailer transporter: records options and messages, or fails like Gmail does. */
function fakeSmtp(failWith?: Record<string, unknown>) {
  const sent: OutgoingMail[] = [];
  let options: Record<string, unknown> = {};
  const factory = (o: Record<string, unknown>) => {
    options = o;
    return {
      async sendMail(mail: OutgoingMail) {
        if (failWith) throw Object.assign(new Error(String(failWith.message ?? "fail")), failWith);
        sent.push(mail);
      },
      async verify() {
        if (failWith) throw Object.assign(new Error(String(failWith.message ?? "fail")), failWith);
      },
    };
  };
  return { sent, factory, options: () => options };
}

const mail: OutgoingMail = { from: "BUNIQ <shop@gmail.com>", to: "client@example.com", subject: "S", text: "T", html: "<p>T</p>" };

describe("Gmail SMTP transport (fake transporter, nothing is sent)", () => {
  test("sends through smtp.gmail.com with the app password", async () => {
    const smtp = fakeSmtp();
    const transport = createGmailTransport({ user: "shop@gmail.com", pass: "abcdefghijklmnop", port: 465 }, smtp.factory);
    assert.deepEqual(await transport.send(mail), { ok: true });
    assert.equal(smtp.sent.length, 1);
    assert.equal(smtp.options().host, "smtp.gmail.com");
    assert.deepEqual(smtp.options().auth, { user: "shop@gmail.com", pass: "abcdefghijklmnop" });
  });

  test("an authentication failure becomes a short code — never the server's text or the password", async () => {
    const smtp = fakeSmtp({ code: "EAUTH", responseCode: 535, message: "535-5.7.8 Username and Password not accepted for shop@gmail.com abcdefghijklmnop" });
    const transport = createGmailTransport({ user: "shop@gmail.com", pass: "abcdefghijklmnop", port: 465 }, smtp.factory);
    const result = await transport.send(mail);
    assert.deepEqual(result, { ok: false, reason: "EAUTH 535" });
    assert.deepEqual(await transport.verify(), { ok: false, reason: "EAUTH 535" });
  });

  test("connection problems and odd errors are reduced to safe codes", () => {
    assert.equal(safeSmtpReason(Object.assign(new Error("connect ETIMEDOUT 1.2.3.4:465"), { code: "ETIMEDOUT" })), "ETIMEDOUT");
    assert.equal(safeSmtpReason(Object.assign(new Error("x"), { code: "weird code with secret" })), "SMTP_ERROR");
    assert.equal(safeSmtpReason("string"), "unknown error");
  });

  test("Resend transport reports the HTTP status only", async () => {
    const fail = createResendTransport("re_secret", (async () => new Response("{\"message\":\"bad key re_secret\"}", { status: 401 })) as typeof fetch);
    assert.deepEqual(await fail.send(mail), { ok: false, reason: "HTTP 401" });
    const down = createResendTransport("re_secret", (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    assert.deepEqual(await down.send(mail), { ok: false, reason: "TypeError" });
  });
});

describe("sendMail", () => {
  after(() => setMailTransportForTests(null));

  test("disabled without configuration: says so, sends nothing", async () => {
    setMailTransportForTests(null);
    const saved = { ...process.env };
    for (const k of ["EMAIL_PROVIDER", "GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY"]) delete process.env[k];
    try {
      assert.equal(mailEnabled(), false);
      assert.deepEqual(await sendMail({ to: "a@example.com", subject: "s", text: "t", html: "h" }), { ok: false, reason: "disabled" });
    } finally {
      Object.assign(process.env, saved);
    }
  });

  test("uses the configured sender, refuses invalid recipients, survives a throwing transport", async () => {
    const sent: OutgoingMail[] = [];
    setMailTransportForTests({ send: async (m) => (sent.push(m), { ok: true }) });
    assert.deepEqual(await sendMail({ to: "not-an-address", subject: "s", text: "t", html: "h" }), { ok: false, reason: "invalid recipient" });
    assert.deepEqual(await sendMail({ to: " a@example.com ", subject: "s", text: "t", html: "h" }), { ok: true });
    assert.equal(sent[0]?.to, "a@example.com");
    assert.equal(sent[0]?.from, "BUNIQ <test@example.com>");
    setMailTransportForTests({
      send: async () => {
        throw new Error("boom");
      },
    });
    assert.deepEqual(await sendMail({ to: "a@example.com", subject: "s", text: "t", html: "h" }), { ok: false, reason: "Error" });
  });
});

describe("e-mail templates", () => {
  const order: EmailOrder & { id: string } = {
    id: "665f000000000000000000ab",
    number: "FB-ABC23456",
    customerName: "Ana <script>alert(1)</script>",
    customerEmail: "ana@example.com",
    customerPhone: "069123456",
    deliveryMethod: "DELIVERY",
    deliveryAddress: "Str. Test 1 & 2",
    location: null,
    paymentMethod: "CARD_ONLINE",
    paymentBank: "maib",
    subtotal: 25_000,
    deliveryFee: 0,
    total: 25_000,
    notes: "Fără ceapă",
    demo: true,
    items: [{ productName: "Burger \"Classic\"", quantity: 2, total: 25_000, options: [{ name: "Bacon" }] }],
  };

  test("customer values are escaped in HTML; a plain-text part is included", () => {
    const m = orderReceivedEmail(order, "ru");
    assert.equal(m.to, "ana@example.com");
    assert.ok(m.subject.includes("FB-ABC23456"));
    assert.ok(!m.html.includes("<script>"));
    assert.ok(m.html.includes("Str. Test 1 &amp; 2"));
    assert.ok(m.html.includes('name="viewport"'), "mobile viewport");
    assert.ok(m.html.includes("max-width:560px"), "narrow column for phones");
    assert.ok(m.text.includes("FB-ABC23456") && m.text.includes("/ru/order/FB-ABC23456"));
    assert.ok(m.text.includes("ссылку на оплату"), "online payment note");
    assert.ok(!m.text.includes("ДЕМО"), "customer e-mails carry no demo wording (demo customers get none)");
  });

  test("status e-mail in the order's language, owner e-mail with contact details", () => {
    const s = orderStatusEmail(order, "OUT_FOR_DELIVERY", "en");
    assert.ok(s.subject.includes("FB-ABC23456"));
    assert.ok(s.text.includes("on its way"));
    const a = adminNewOrderEmail(order, "owner@example.com");
    assert.equal(a.to, "owner@example.com");
    assert.ok(a.html.includes("Ana &lt;script&gt;") && !a.html.includes("<script>"), "customer name escaped");
    assert.ok(a.subject.startsWith("[демо]"));
    assert.ok(a.text.includes("ДЕМО-ЗАКАЗ"), "the owner sees plainly that it is a demo order");
    assert.ok(a.text.includes("069123456") && a.text.includes("/admin/orders/665f000000000000000000ab"));
  });

  test("link e-mail: a button and the same link as text", () => {
    const m = linkEmail("ro", "a@example.com", { subject: "Subiect", intro: "Intro", button: "Apasă", outro: "Final" }, "https://x.test/account/reset?token=abc");
    assert.ok(m.html.includes('href="https://x.test/account/reset?token=abc"'));
    assert.ok(m.text.includes("Apasă: https://x.test/account/reset?token=abc"));
  });
});
