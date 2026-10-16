// scripts/preview-db.mjs prepares the separate Preview database. These tests run it only against made-up files in a
// temporary folder, on addresses that cannot be reached, and check that it stops before anything is run.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";

const { inspectPreviewEnv, PreviewDbError } = await import("../scripts/preview-db.mjs");

const URL_PREVIEW = "mongodb+srv://preview_user:Preview-pw-1@cluster.example.test/fastburgers_preview?retryWrites=true&w=majority";
const URL_PROD = "mongodb+srv://prod_user:Prod-pw-1@cluster.example.test/fastburgers?retryWrites=true&w=majority";
const ADMIN = { ADMIN_EMAIL: "preview-admin@example.test", ADMIN_PASSWORD: "Preview-Admin-1!x" };

const reason = (preview: Record<string, string>, production: Record<string, string> | null = null) => {
  try {
    inspectPreviewEnv(preview, production);
  } catch (error) {
    assert.ok(error instanceof PreviewDbError, String(error));
    return error.message;
  }
  return null;
};

describe("inspectPreviewEnv", () => {
  test("accepts the Preview address with its own user, and reports only non-secret facts", () => {
    const info = inspectPreviewEnv({ DATABASE_URL: URL_PREVIEW, ...ADMIN }, { DATABASE_URL: URL_PROD });
    assert.equal(info.database, "fastburgers_preview");
    assert.equal(info.host, "cluster.example.test");
    assert.equal(info.adminEmail, "preview-admin@example.test");
    assert.ok(info.secrets.includes("Preview-pw-1") && info.secrets.includes("Preview-Admin-1!x"));
    assert.doesNotMatch(JSON.stringify({ ...info, secrets: undefined }), /Preview-pw-1|preview_user|Preview-Admin/);
  });

  test("refuses the production address, look-alike names, missing or placeholder parts", () => {
    const bad: Record<string, string>[] = [
      {},
      { DATABASE_URL: URL_PROD },
      { DATABASE_URL: URL_PREVIEW.replace("fastburgers_preview", "fastburgers_preview2") },
      { DATABASE_URL: URL_PREVIEW.replace("fastburgers_preview", "fastburgers%5Fpreview") },
      { DATABASE_URL: URL_PREVIEW.replace("Preview-pw-1", "<password>") },
      { DATABASE_URL: URL_PREVIEW.replace("preview_user:Preview-pw-1@", "") },
      { DATABASE_URL: URL_PREVIEW.replace("preview_user:Preview-pw-1", "preview_user") },
      { DATABASE_URL: "mongodb://preview_user:pw@127.0.0.1:27017/fastburgers_preview" }, // not an Atlas address
    ];
    for (const preview of bad) {
      const message = reason(preview);
      assert.ok(message, JSON.stringify(Object.keys(preview)));
      assert.doesNotMatch(message, /Preview-pw-1|Prod-pw-1|preview_user|prod_user|example\.test/);
    }
  });

  test("refuses to share the user, the password or the database with the production file", () => {
    assert.match(reason({ DATABASE_URL: URL_PREVIEW }, { DATABASE_URL: URL_PREVIEW.replace("fastburgers_preview", "fastburgers") }) ?? "", /own Atlas user/);
    assert.match(reason({ DATABASE_URL: URL_PREVIEW }, { DATABASE_URL: URL_PROD.replace("prod_user", "other").replace("Prod-pw-1", "Preview-pw-1") }) ?? "", /own password/);
    assert.match(reason({ DATABASE_URL: URL_PREVIEW }, { DATABASE_URL: URL_PREVIEW }) ?? "", /also names the Preview database/);
    assert.equal(reason({ DATABASE_URL: URL_PREVIEW }, null), null); // no production file: nothing to compare with
  });
});

describe("the command line", () => {
  const folder = mkdtempSync(path.join(tmpdir(), "preview-db-"));
  after(() => rmSync(folder, { recursive: true, force: true }));
  const script = path.resolve("scripts", "preview-db.mjs");
  const run = (args: string[], files: Record<string, string>) => {
    for (const name of [".env.preview", ".env.atlas"]) rmSync(path.join(folder, name), { force: true });
    for (const [name, text] of Object.entries(files)) writeFileSync(path.join(folder, name), text);
    const result = spawnSync(process.execPath, [script, ...args], { cwd: folder, encoding: "utf8", timeout: 30_000, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot } as unknown as NodeJS.ProcessEnv });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  };
  const preview = `DATABASE_URL="${URL_PREVIEW}"\nADMIN_EMAIL=${ADMIN.ADMIN_EMAIL}\nADMIN_PASSWORD="${ADMIN.ADMIN_PASSWORD}"\n`;

  test("a missing .env.preview, the production address or a shared user stop every command before anything runs", () => {
    for (const command of ["check", "push", "seed"]) {
      const none = run([command, "--confirm-preview"], {});
      assert.equal(none.status, 1);
      assert.match(none.output, /\.env\.preview not found/);
      const prod = run([command, "--confirm-preview"], { ".env.preview": `DATABASE_URL="${URL_PROD}"\n` });
      assert.equal(prod.status, 1);
      assert.match(prod.output, /Nothing was run/);
      const shared = run([command, "--confirm-preview"], { ".env.preview": preview, ".env.atlas": `DATABASE_URL="${URL_PREVIEW.replace("fastburgers_preview", "fastburgers")}"\n` });
      assert.equal(shared.status, 1);
      assert.match(shared.output, /own Atlas user/);
      for (const run of [none, prod, shared]) assert.doesNotMatch(run.output, /Preview-pw-1|Prod-pw-1|preview_user|prod_user|Preview-Admin|mongodb/);
    }
  });

  test("push and seed need --confirm-preview; unknown commands are refused", () => {
    for (const command of ["push", "seed"]) {
      const result = run([command], { ".env.preview": preview });
      assert.equal(result.status, 1);
      assert.match(result.output, /--confirm-preview/);
      assert.match(result.output, /fastburgers_preview/);
      assert.doesNotMatch(result.output, /Preview-pw-1|preview_user|Preview-Admin|mongodb/);
    }
    assert.equal(run(["drop"], { ".env.preview": preview }).status, 2);
  });
});
