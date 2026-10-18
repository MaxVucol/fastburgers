// Browser check for "the page scrolls but no button reacts": a modal <dialog> that stays open behind the page blocks
// every click while scrolling still works. Needs Google Chrome and a running site (`npm run build && npm start`, or a
// deployed address). Read-only: it only opens menus and dialogs and switches the language cookie of its own throw-away
// profile; it places no order and changes no data.
//
//   node scripts/check-modal-lock.mjs [baseUrl]        (default http://127.0.0.1:3000; CHROME=path to chrome.exe overrides)
//
// Exit code 1 when a scenario fails. Scenarios (phone-sized viewport):
//   A  menu → another language: no dialog may stay open, and the menu must open again on the new page
//   B  (700px wide) product-card window open → browser Back / Forward: no dialog may stay open on either page
//   C  (desktop width) search window open → page scrolled to the top behind it: the dialog is still visible and can be closed
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const CHROME = process.env.CHROME ?? ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
if (!CHROME) {
  console.error("Chrome not found: set CHROME to its path.");
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(name);
};

async function session(run, viewport = { width: 390, height: 844, mobile: true }) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(path.join(tmpdir(), "modal-lock-"));
  const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--headless=new", "--no-first-run", "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(200);
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === "page"); } catch {}
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));
    let id = 0, loaded = false;
    const pending = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === "Page.loadEventFired") loaded = true;
    });
    const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
    const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.result?.value;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: viewport.mobile ? 2 : 1 });
    if (viewport.mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    const go = async (url) => { loaded = false; await send("Page.navigate", { url }); for (let i = 0; i < 300 && !loaded; i++) await sleep(100); await sleep(2500); };
    const tap = async (js) => {
      const raw = await ev(`(()=>{const e=${js};if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`);
      if (!raw) return false;
      const p = JSON.parse(raw);
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 });
      return true;
    };
    await run({ ev, go, tap, sleep });
    ws.close();
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

const openDialogs = (ev) => ev("document.querySelectorAll('dialog[open]').length");
// Open dialogs the visitor can actually see (a dialog left open inside a hidden page tree is not one of them).
const visibleDialogs = (ev) => ev("[...document.querySelectorAll('dialog[open]')].filter(d=>d.checkVisibility()).length");
const inView = "x&&x.checkVisibility()&&x.getBoundingClientRect().bottom>0&&x.getBoundingClientRect().top<innerHeight";
const menuButton = `[...document.querySelectorAll('dialog.drawer-left')].map(d=>d.previousElementSibling).find(x=>${inView})`;

// A ─ language switched from the phone menu
await session(async ({ ev, go, tap, sleep }) => {
  await go(`${BASE}/`);
  check("A: the menu opens", (await tap(menuButton)) && (await sleep(900), (await visibleDialogs(ev)) === 1));
  const switched = await tap("document.querySelector('dialog[open] a[hreflang=ru]')");
  await sleep(3500);
  check("A: language switched", switched && (await ev("location.pathname")).startsWith("/ru"), await ev("location.pathname"));
  check("A: no dialog is left open behind the new page", (await openDialogs(ev)) === 0, `${await openDialogs(ev)} open`);
  await tap(menuButton);
  await sleep(900);
  check("A: the menu opens again on the new page", (await visibleDialogs(ev)) === 1, `${await visibleDialogs(ev)} visible`);
});

// B ─ a product-card window open while leaving with Back / Forward (700px wide: below 640px the quick-view eye is not shown)
await session(async ({ ev, go, tap, sleep }) => {
  await go(`${BASE}/`);
  await ev(`[...document.querySelectorAll('a[href="/menu"]')].find(a=>a.checkVisibility())?.click()`);
  await sleep(2500);
  // Bring the first card button that opens a window (the quick-view eye is hidden on phones: the "+" of a dish with extras) into view.
  await ev("[...document.querySelectorAll('main button[aria-haspopup=dialog]')].find(x=>x.checkVisibility())?.scrollIntoView({ block: 'center' })");
  await sleep(800);
  const opened = await tap(`[...document.querySelectorAll('main button[aria-haspopup=dialog]')].find(x=>${inView})`);
  await sleep(900);
  check("B: a card window opens", opened && (await openDialogs(ev)) === 1);
  await ev("history.back()");
  await sleep(2500);
  check("B: Back leaves no dialog open", (await openDialogs(ev)) === 0, `${await openDialogs(ev)} open on ${await ev("location.pathname")}`);
  await ev("history.forward()");
  await sleep(2500);
  check("B: Forward shows no stale dialog", (await openDialogs(ev)) === 0, `${await openDialogs(ev)} open on ${await ev("location.pathname")}`);
}, { width: 700, height: 900, mobile: true });

// C ─ search window, page scrolled behind it
await session(async ({ ev, go, tap, sleep }) => {
  await go(`${BASE}/`);
  await ev("window.scrollTo(0, 1200)");
  await sleep(1200);
  const search = `[...document.querySelectorAll('dialog')].filter(d=>d.querySelector('input[name=q]')&&!d.classList.contains('drawer-left')).map(d=>d.previousElementSibling).find(x=>${inView})`;
  const opened = await tap(search);
  await sleep(900);
  await ev("window.scrollTo(0, 0)");
  await sleep(1200);
  const state = JSON.parse(await ev("JSON.stringify({open:document.querySelectorAll('dialog[open]').length,visible:[...document.querySelectorAll('dialog[open]')].every(d=>d.checkVisibility())})"));
  check("C: search opened from the compact bar and is still visible after scrolling to the top", opened && state.open === 1 && state.visible, JSON.stringify(state));
  await tap("document.querySelector('dialog[open] button[aria-label]')");
  await sleep(700);
  check("C: it can be closed", (await openDialogs(ev)) === 0);
}, { width: 1280, height: 800, mobile: false });

console.log(failures.length ? `\n${failures.length} check(s) FAILED` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
