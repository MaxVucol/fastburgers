// A Vercel Preview deployment must run on its own database, take no orders otherwise, and never message
// anyone (Telegram, e-mail) or write to the Blob store, whatever environment variables it was given.
// Production behaviour must stay exactly as it was. No database is needed: the guards act before any query,
// and the address below is unreachable on purpose, so a guard that failed would show up as a connection error.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { after, describe, test } from "node:test";

process.env.AUTH_SECRET ??= "unit-test-secret-unit-test-secret-0123";
process.env.DATABASE_URL = "mongodb://127.0.0.1:1/fastburgers?directConnection=true&serverSelectionTimeoutMS=300&connectTimeoutMS=300";

const guard = await import("@/lib/preview-guard.mjs");
const { sendTelegramMessage, telegramEnabled } = await import("@/lib/telegram");
const { mailEnabled, sendMail, setMailTransportForTests } = await import("@/lib/mail");
const { notifyNewOrder } = await import("@/services/order-notifications");
const { sendNewOrderEmails, sendOrderStatusEmail } = await import("@/services/order-emails");
const { createOrder, OrderError } = await import("@/services/orders");
const { placeOrder } = await import("@/actions/checkout");
const { getDictionary } = await import("@/lib/i18n/dictionaries");

type Env = Record<string, string | undefined>;

/** Runs `fn` with these variables set (undefined removes one) and restores the previous values afterwards. */
async function withEnv<T>(env: Env, fn: () => T | Promise<T>): Promise<T> {
  const saved: Env = {};
  for (const key of Object.keys(env)) {
    saved[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// Made-up addresses on a reserved test domain; the "passwords" are not real.
const PROD = "mongodb+srv://app:Pw-for-tests@cluster.example.test/fastburgers?retryWrites=true&w=majority";
const PREVIEW = "mongodb+srv://preview_app:Pw-for-tests@cluster.example.test/fastburgers_preview?retryWrites=true&w=majority";
const PREVIEW_ENV: Env = { VERCEL: "1", VERCEL_ENV: "preview" };
const CONFIGURED: Env = {
  // Assembled at run time: no token-shaped literal in the source (secret scanners).
  TELEGRAM_BOT_TOKEN: ["111111111", "test-token-for-unit-tests"].join(":"),
  TELEGRAM_CHAT_ID: "42",
  EMAIL_PROVIDER: "gmail",
  GMAIL_USER: "sender@example.test",
  GMAIL_APP_PASSWORD: "abcdefghijklmnop",
  ADMIN_NOTIFY_EMAIL: "owner@example.test",
  BLOB_READ_WRITE_TOKEN: ["vercel", "blob", "rw", "abcdefgh12345", "notarealsecret"].join("_"),
};

// ───────────────────────── The database check ─────────────────────────

describe("the Preview database check", () => {
  test("accepts exactly fastburgers_preview, in every address format Prisma/MongoDB uses", () => {
    for (const url of [
      PREVIEW,
      "mongodb://127.0.0.1:27017/fastburgers_preview?replicaSet=rs0&directConnection=true",
      "mongodb://u:p@h1.example.test:27017,h2.example.test:27017,h3.example.test:27017/fastburgers_preview?replicaSet=rs0",
      "mongodb://h.example.test/fastburgers_preview",
      "MONGODB+SRV://u:p@h.example.test/fastburgers_preview?x=1",
    ]) {
      assert.deepEqual(guard.checkPreviewDatabase({ DATABASE_URL: url }), { ok: true }, url.replace(/\/\/.*@/, "//…@"));
    }
  });

  test("rejects the production database and every look-alike or trick", () => {
    const bad = [
      PROD,
      "mongodb://127.0.0.1:27017/fastburgers",
      "mongodb://h.example.test/fastburgers_preview2", // suffix
      "mongodb://h.example.test/my_fastburgers_preview", // prefix
      "mongodb://h.example.test/Fastburgers_Preview", // case
      "mongodb://h.example.test/FASTBURGERS_PREVIEW",
      "mongodb://h.example.test/fastburgers%5Fpreview", // encoded: not the plain name
      "mongodb://h.example.test/fastburgers_preview/", // trailing slash
      "mongodb://h.example.test/fastburgers_preview/fastburgers", // second segment
      "mongodb://h.example.test/fastburgers/fastburgers_preview",
      "mongodb://h.example.test//fastburgers_preview",
      "mongodb://h.example.test/fastburgers_preview ", // trailing space is part of the name Prisma sees
      "mongodb://h.example.test/fastburgers_preview\n",
      " mongodb://h.example.test/fastburgers_preview",
      "mongodb://h.example.test/?authSource=fastburgers_preview", // no name, only an option
      "mongodb://h.example.test?db=fastburgers_preview",
      "mongodb://h.example.test/fastburgers?x=/fastburgers_preview", // name hidden in the query
      "mongodb://h.example.test/fastburgers#/fastburgers_preview", // …or the fragment
      "mongodb://fastburgers_preview:pw@h.example.test/fastburgers", // …or the user name
      "mongodb://u:pw@fastburgers_preview.example.test/fastburgers", // …or the host
      "mongodb://u:/fastburgers_preview@h.example.test/fastburgers", // …or an unencoded password
      "mongodb://u:p@h.example.test/fastburgers@h2/fastburgers_preview",
      "mongodb://h.example.test",
      "mongodb://h.example.test/",
      "http://h.example.test/fastburgers_preview",
      "postgres://h.example.test/fastburgers_preview",
      "fastburgers_preview",
      "mongodb:/h.example.test/fastburgers_preview",
      "",
      "   ",
    ];
    for (const url of bad) {
      assert.equal(guard.checkPreviewDatabase({ DATABASE_URL: url }).ok, false, `accepted: ${url.replace(/:[^:@/]*@/, ":…@")}`);
    }
    assert.equal(guard.checkPreviewDatabase({}).ok, false);
  });

  test("the reasons never contain the address or the password", () => {
    for (const url of [PROD, "mongodb://u:SuperSecret1@h.example.test", "garbage-SuperSecret1", ""]) {
      const result = guard.checkPreviewDatabase({ DATABASE_URL: url });
      assert.equal(result.ok, false);
      const text = JSON.stringify(result);
      assert.doesNotMatch(text, /SuperSecret1|Pw-for-tests|example\.test/);
    }
  });

  test("only VERCEL_ENV=preview is a Preview", () => {
    assert.equal(guard.isPreviewDeployment({ VERCEL_ENV: "preview" }), true);
    for (const env of [{}, { VERCEL_ENV: "production" }, { VERCEL_ENV: "development" }, { VERCEL_ENV: "Preview" }, { VERCEL: "1" }]) {
      assert.equal(guard.isPreviewDeployment(env), false, JSON.stringify(env));
    }
  });
});

// ───────────────────────── Orders ─────────────────────────

const ORDER_INPUT = {
  customerName: "Test Customer",
  customerPhone: "+37369000000",
  customerEmail: "customer@example.test",
  deliveryMethod: "DELIVERY",
  deliveryAddress: "Str. Test 1, Chisinau",
  paymentMethod: "CASH",
  items: [{ productId: "a".repeat(24), quantity: 1, optionIds: [] }],
};

describe("Preview and orders", () => {
  test("a Preview on the production database refuses the order before touching the database, in every language", async () => {
    for (const lang of ["ro", "ru", "en"] as const) {
      const result = await withEnv({ ...PREVIEW_ENV, DATABASE_URL: PROD }, () => placeOrder(ORDER_INPUT, lang));
      assert.equal(result.ok, false);
      assert.equal((result as { error: string }).error, getDictionary(lang).errors.previewDatabase);
    }
  });

  test("ORDER_MODE=live does not lift the refusal", async () => {
    const result = await withEnv({ ...PREVIEW_ENV, DATABASE_URL: PROD, ORDER_MODE: "live" }, () => placeOrder(ORDER_INPUT, "en"));
    assert.equal((result as { error: string }).error, getDictionary("en").errors.previewDatabase);
  });

  test("a Preview with no DATABASE_URL, or a look-alike name, refuses too", async () => {
    for (const DATABASE_URL of [undefined, "mongodb://127.0.0.1:1/fastburgers_preview2", "mongodb://127.0.0.1:1/fastburgers%5Fpreview"]) {
      const result = await withEnv({ ...PREVIEW_ENV, DATABASE_URL }, () => placeOrder(ORDER_INPUT, "en"));
      assert.equal((result as { error: string }).error, getDictionary("en").errors.previewDatabase);
    }
  });

  test("the order service has the same backstop for any other caller", async () => {
    await withEnv({ ...PREVIEW_ENV, DATABASE_URL: PROD }, async () => {
      await assert.rejects(
        () => createOrder(ORDER_INPUT as never),
        (error: unknown) => error instanceof OrderError && error.code === "previewDatabase",
      );
    });
  });

  test("a Preview on its own database is not blocked, and its orders are always demo orders", () => {
    const env = { ...PREVIEW_ENV, DATABASE_URL: PREVIEW };
    assert.equal(guard.previewDatabaseBlocked(env), false);
    assert.equal(guard.ordersAreDemo({ ...env, ORDER_MODE: "live" }), true);
    assert.equal(guard.ordersAreDemo(env), true);
  });

  test("Production is unchanged: never blocked (whatever its database), ORDER_MODE=live means real orders", () => {
    for (const DATABASE_URL of [PROD, PREVIEW, undefined, "garbage"]) {
      assert.equal(guard.previewDatabaseBlocked({ VERCEL_ENV: "production", DATABASE_URL }), false);
      assert.equal(guard.previewDatabaseBlocked({ DATABASE_URL }), false); // local development
    }
    assert.equal(guard.ordersAreDemo({ VERCEL_ENV: "production", ORDER_MODE: "live" }), false);
    assert.equal(guard.ordersAreDemo({ VERCEL_ENV: "production", ORDER_MODE: " live " }), false);
    assert.equal(guard.ordersAreDemo({ VERCEL_ENV: "production" }), true);
    assert.equal(guard.ordersAreDemo({ VERCEL_ENV: "production", ORDER_MODE: "demo" }), true);
    assert.equal(guard.ordersAreDemo({ ORDER_MODE: "live" }), false);
    assert.equal(guard.ordersAreDemo({}), true);
  });
});

// ───────────────────────── Telegram, e-mail, Blob ─────────────────────────

describe("Preview closes the outgoing channels, whatever is configured", () => {
  after(() => setMailTransportForTests(null));

  /** Replaces fetch with a recorder for the duration of `fn`. */
  async function recordingFetch<T>(fn: () => Promise<T>) {
    const original = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = (async (input: unknown) => {
      calls.push(String(input).replace(/bot[^/]+/, "bot<token>"));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      return { value: await fn(), calls };
    } finally {
      globalThis.fetch = original;
    }
  }

  test("Telegram: not enabled, no request leaves, the new-order notice is skipped without a database", async () => {
    await withEnv({ ...PREVIEW_ENV, ...CONFIGURED, DATABASE_URL: PREVIEW, ORDER_MODE: "live" }, async () => {
      assert.equal(telegramEnabled(), false);
      const { value, calls } = await recordingFetch(async () => ({
        direct: await sendTelegramMessage("hello"),
        notice: await notifyNewOrder("a".repeat(24)),
      }));
      assert.deepEqual(calls, []);
      assert.equal(value.direct.ok, false);
      assert.equal(value.notice, "skipped");
    });
  });

  test("Telegram: Production still sends when configured", async () => {
    await withEnv({ VERCEL_ENV: "production", ...CONFIGURED }, async () => {
      assert.equal(telegramEnabled(), true);
      const { value, calls } = await recordingFetch(() => sendTelegramMessage("hello"));
      assert.deepEqual(value, { ok: true });
      assert.deepEqual(calls, ["https://api.telegram.org/bot<token>/sendMessage"]);
    });
    await withEnv({ VERCEL_ENV: undefined, ...CONFIGURED }, async () => assert.equal(telegramEnabled(), true)); // local
  });

  test("E-mail: disabled, nothing is handed to any transport, no order e-mail is claimed", async () => {
    const sent: unknown[] = [];
    setMailTransportForTests({ send: async (mail) => (sent.push(mail), { ok: true }) });
    await withEnv({ ...PREVIEW_ENV, ...CONFIGURED, DATABASE_URL: PREVIEW }, async () => {
      assert.equal(mailEnabled(), false);
      const result = await sendMail({ to: "customer@example.test", subject: "s", text: "t", html: "<p>t</p>" });
      assert.deepEqual(result, { ok: false, reason: "disabled" });
      const viaOrder: unknown[] = [];
      const record = async (mail: unknown) => (viaOrder.push(mail), { ok: true as const });
      assert.deepEqual(await sendNewOrderEmails("a".repeat(24), record, "owner@example.test"), { customer: "skipped", admin: "skipped" });
      assert.equal(await sendOrderStatusEmail("a".repeat(24), "CONFIRMED", record), "skipped");
      assert.deepEqual(viaOrder, []);
    });
    assert.deepEqual(sent, []);
  });

  test("E-mail: outside Preview a configured transport is used as before", async () => {
    const sent: unknown[] = [];
    setMailTransportForTests({ send: async (mail) => (sent.push(mail), { ok: true }) });
    for (const VERCEL_ENV of ["production", undefined]) {
      await withEnv({ VERCEL_ENV }, async () => {
        assert.equal(mailEnabled(), true);
        assert.deepEqual(await sendMail({ to: "customer@example.test", subject: "s", text: "t", html: "<p>t</p>" }), { ok: true });
      });
    }
    assert.equal(sent.length, 2);
  });

  test("Blob: a Preview never uploads or deletes, even when a Blob token is present", async () => {
    const storage = await import("@/lib/storage");
    const original = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = (async (input: unknown) => (calls.push(String(input)), new Response("{}", { status: 500 }))) as typeof fetch;
    try {
      await withEnv({ ...PREVIEW_ENV, ...CONFIGURED }, async () => {
        // A valid image would be uploaded in Production; here it must stop at "not configured", with no request made.
        const sharp = (await import("sharp")).default;
        const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer();
        const file = new File([new Uint8Array(image)], "x.png", { type: "image/png" });
        await assert.rejects(() => storage.saveImage(file), /nu este configurată/);
        await storage.deleteImage("https://abcdefgh12345.public.blob.vercel-storage.com/uploads/x.webp");
      });
    } finally {
      globalThis.fetch = original;
    }
    assert.deepEqual(calls, []);
  });
});

// ───────────────────────── The build check (scripts/check-env.mjs) ─────────────────────────

describe("the build stops on a Preview that is not on the Preview database", () => {
  const root = process.cwd();
  const run = (env: Env) => {
    const base: Env = { ...process.env, ...env };
    // Never inherit a real environment into this check.
    for (const key of ["VERCEL", "VERCEL_ENV", "DATABASE_URL", "ORDER_MODE", "BLOB_READ_WRITE_TOKEN", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY"]) {
      if (!(key in env)) delete base[key];
    }
    const result = spawnSync(process.execPath, [path.join("scripts", "check-env.mjs")], { cwd: root, env: base as NodeJS.ProcessEnv, encoding: "utf8", timeout: 30_000 });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  };
  const secret = "A".repeat(40);

  test("Preview + production database: the build fails, and the output holds no part of the address", () => {
    const { status, output } = run({ VERCEL: "1", VERCEL_ENV: "preview", DATABASE_URL: PROD, AUTH_SECRET: secret });
    assert.equal(status, 1);
    assert.match(output, /Preview database/);
    assert.doesNotMatch(output, /Pw-for-tests|example\.test|app:|retryWrites/);
  });

  test("Preview + missing or look-alike database: the build fails", () => {
    for (const DATABASE_URL of [undefined, "mongodb://h.example.test/fastburgers_preview2", "mongodb://h.example.test/fastburgers%5Fpreview"]) {
      const { status, output } = run({ VERCEL: "1", VERCEL_ENV: "preview", AUTH_SECRET: secret, ...(DATABASE_URL ? { DATABASE_URL } : {}) });
      assert.equal(status, 1, String(DATABASE_URL));
      assert.doesNotMatch(output, /example\.test/);
    }
  });

  test("Preview + fastburgers_preview: the build passes; ORDER_MODE=live and a Blob token only warn (and are ignored)", () => {
    const { status, output } = run({ VERCEL: "1", VERCEL_ENV: "preview", DATABASE_URL: PREVIEW, AUTH_SECRET: secret, ORDER_MODE: "live", BLOB_READ_WRITE_TOKEN: CONFIGURED.BLOB_READ_WRITE_TOKEN });
    assert.equal(status, 0, output);
    assert.match(output, /ORDER_MODE is "live" on a Preview deployment: it is ignored/);
    assert.match(output, /BLOB_READ_WRITE_TOKEN is set on a Preview deployment: it is ignored/);
    assert.doesNotMatch(output, /notarealsecret|Pw-for-tests/);
  });

  test("Production and local builds are not affected by the Preview rule", () => {
    assert.equal(run({ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: PROD, AUTH_SECRET: secret, ORDER_MODE: "live" }).status, 0);
    assert.equal(run({ DATABASE_URL: "mongodb://127.0.0.1:27017/fastburgers?replicaSet=rs0&directConnection=true", AUTH_SECRET: secret }).status, 0);
  });
});
