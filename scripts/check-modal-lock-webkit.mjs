// Safari-engine (WebKit) version of scripts/check-modal-lock.mjs: iPhone emulation with real touch taps.
// A modal <dialog> left open behind the page after a language change blocks every tap while scrolling still works.
//
// Playwright is not a dependency of the project. Install it outside it and point NODE_PATH there, e.g.
//   mkdir ~/pw && cd ~/pw && npm init -y && npm i playwright && npx playwright install webkit
//   export NODE_PATH=~/pw/node_modules        (Windows cmd: set NODE_PATH=%USERPROFILE%\pw\node_modules)
//   then, in the project: node scripts/check-modal-lock-webkit.mjs http://127.0.0.1:3000
// Read-only: opens menus and dialogs and switches the language of its own throw-away browser context; no order, no data change.
// This is WebKit on a desktop, not Safari on a real iPhone: it covers the engine, not the device.
//
//   node scripts/check-modal-lock-webkit.mjs [baseUrl]   (exit code 1 when a check fails)
import { createRequire } from "node:module";

let webkit, devices;
try {
  ({ webkit, devices } = createRequire(import.meta.url)("playwright"));
} catch {
  console.error("Playwright not found: see the setup in the header of this file (NODE_PATH must point at its node_modules).");
  process.exit(2);
}

const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const failures = [];
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`); if (!ok) failures.push(name); };
const why = (e) => { const lines = String(e.message).split(/\r?\n/); return (lines.find((l) => l.includes("intercepts")) ?? lines[0]).replace(/\u001b\[[0-9;]*m/g, "").trim().slice(0, 140); };
const browser = await webkit.launch();
const newPage = async () => { const ctx = await browser.newContext({ ...devices["iPhone 15 Pro Max"] }); const page = await ctx.newPage(); page.on("pageerror", (e) => console.log("  pageerror:", String(e).slice(0, 120))); return page; };
const dialogs = (page) => page.evaluate(() => ({
  open: document.querySelectorAll("dialog[open]").length,
  visible: [...document.querySelectorAll("dialog[open]")].filter((d) => d.checkVisibility?.() ?? d.getClientRects().length > 0).length,
  modal: [...document.querySelectorAll("dialog")].filter((d) => d.matches(":modal")).length,
}));
const menuIndex = (page) => page.locator("dialog.drawer-left").evaluateAll((ds) => ds.map((d) => d.previousElementSibling).findIndex((b) => b && b.getClientRects().length > 0 && b.getBoundingClientRect().top >= 0));
async function tap(locator, label) {
  try { await locator.tap({ timeout: 4000 }); return true; } catch (e) { console.log(`  tap on ${label} not delivered: ${why(e)}`); return false; }
}
async function tapMenu(page) {
  const idx = await menuIndex(page);
  if (idx < 0) return false;
  const ok = await tap(page.locator("dialog.drawer-left").nth(idx).locator("xpath=preceding-sibling::button[1]"), "the menu button");
  await page.waitForTimeout(900);
  return ok;
}

// A ─ language switch from the phone menu
{
  const page = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  check("A: the menu opens (touch tap)", (await tapMenu(page)) && (await dialogs(page)).visible === 1);
  await tap(page.locator("dialog[open] a[hreflang=ru]"), "the RU link");
  await page.waitForTimeout(3500);
  const path = new URL(page.url()).pathname;
  const d = await dialogs(page);
  check("A: language switched", path.startsWith("/ru"), path);
  check("A: no dialog left open, no modal layer", d.open === 0 && d.modal === 0, JSON.stringify(d));
  await tapMenu(page);
  const d2 = await dialogs(page);
  check("A: the menu opens again on the new page", d2.visible === 1 && d2.modal === 1, JSON.stringify(d2));
  await tap(page.locator("dialog[open] button[aria-label]").first(), "the menu's close button");
  await page.waitForTimeout(700);
  check("A: the menu closes", (await dialogs(page)).visible === 0);
  const before = await dialogs(page);
  const cartIdx = await page.locator("#header-expanded button[aria-label]").evaluateAll((bs) => bs.findIndex((b) => b.getClientRects().length > 0 && /(coș|корзин|cart|basket)/i.test(b.getAttribute("aria-label") ?? "")));
  await tap(page.locator("#header-expanded button[aria-label]").nth(cartIdx), "the cart button");
  await page.waitForTimeout(900);
  const after = await dialogs(page);
  check("A: a button of the new page reacts (the cart opens)", after.visible === before.visible + 1, `visible ${before.visible} -> ${after.visible}`);
  await page.context().close();
}

// B ─ product-card window open, then Back / Forward
{
  const page = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.locator('a[href="/menu"]').first().evaluate((a) => a.click());
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(600);
  await tap(page.locator("main button[aria-haspopup=dialog]").first(), "a card button");
  await page.waitForTimeout(900);
  check("B: a card window opens", (await dialogs(page)).visible === 1);
  await page.goBack();
  await page.waitForTimeout(2500);
  let d = await dialogs(page);
  check("B: Back leaves no dialog open", d.open === 0, `${JSON.stringify(d)} on ${new URL(page.url()).pathname}`);
  await page.goForward();
  await page.waitForTimeout(2500);
  d = await dialogs(page);
  check("B: Forward shows no stale dialog", d.open === 0, `${JSON.stringify(d)} on ${new URL(page.url()).pathname}`);
  await page.context().close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) FAILED` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
