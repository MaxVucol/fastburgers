// Regression check for the image optimizer's workload: how many different pictures does it have to produce for one
// visitor of the menu? Every distinct /img URL (source, width, quality) is one picture to encode and to keep in the
// cache layers (before the site had its own optimizer it was one billed Vercel "transformation", 5,000 a month on the
// Hobby plan). A picture that should load only on demand but is requested for every card (for example the large
// one in the closed quick-view dialog) silently doubles the work.
//
// Needs Google Chrome and a LOCAL running build: `npm run build && npm start` (default http://127.0.0.1:3000;
// CHROME=path to chrome.exe overrides). Only loopback addresses are accepted: it never talks to Production or Vercel.
// The browser's /img requests are intercepted and answered with a 1x1 stub, so nothing is fetched from
// Vercel Blob or transformed; it reads the menu and opens one quick-view window, and changes no data.
//
//   node scripts/check-image-variants.mjs [baseUrl]
//
// What it measures, for two fixed devices (phone 430px / DPR 3, desktop 1366px / DPR 1) on the whole menu page:
//   * variants per product photo = distinct (width, quality) pairs requested for the same photo, averaged over all
//     photos. A device only ever needs ONE for the card (the grid's `sizes` and quality are fixed), so the healthy
//     value is 1.00 and the regression it guards against (a second, full-width copy for the dialog) gives about 2.00.
//     The limit 1.10 leaves room for a few cards that are legitimately shown twice, and cannot be crossed by the
//     differences between phones and desktops: each device is judged against itself, never against the other.
//     It is a ratio, so it does not depend on how many products the catalogue has.
//   * no picture inside a closed <dialog> may have been switched to eager loading (that is how the doubling happens);
//   * desktop only: the quick-view picture is still NOT requested before the window opens, and IS loaded after it opens.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const host = new URL(BASE).hostname;
if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(host)) {
  console.error(`Refusing to run against ${host}: this check is for a local build only (use http://127.0.0.1:<port>).`);
  process.exit(2);
}
const CHROME = process.env.CHROME ?? ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
if (!CHROME) {
  console.error("Chrome not found: set CHROME to its path.");
  process.exit(2);
}

const MAX_VARIANTS_PER_PHOTO = 1.1;
const MIN_PHOTOS = 50; // fewer photos than this means the page did not load properly, not that the check passed
const PNG_1X1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(name);
};

async function session(viewport, run) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(path.join(tmpdir(), "image-variants-"));
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
    const requests = []; // every /img URL the page asked for, in order
    let send;
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      if (m.method === "Page.loadEventFired") loaded = true;
      if (m.method === "Fetch.requestPaused") {
        requests.push(m.params.request.url);
        // Answer with a stub: the optimizer, Vercel Blob and the network are never involved.
        send("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "image/png" }], body: PNG_1X1 });
      }
    });
    send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
    const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.result?.value;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: viewport.dpr });
    if (viewport.mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*/img?*" }] });
    const go = async (url) => { loaded = false; await send("Page.navigate", { url }); for (let i = 0; i < 300 && !loaded; i++) await sleep(100); await sleep(2500); };
    const click = async (js) => {
      const raw = await ev(`(()=>{const e=${js};if(!e)return null;e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`);
      if (!raw) return false;
      await sleep(300);
      const p = JSON.parse(await ev(`(()=>{const e=${js};const r=e.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`));
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 });
      return true;
    };
    await run({ ev, go, click, sleep, requests });
    ws.close();
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

/** Product photos only (Blob store or /images/products), grouped by source: the set of "w/q" pairs asked for each one. */
function variantsPerPhoto(urls) {
  const photos = new Map();
  for (const raw of urls) {
    const u = new URL(raw);
    const src = u.searchParams.get("u") ?? "";
    if (!/\/products\//.test(src)) continue;
    if (!photos.has(src)) photos.set(src, new Set());
    photos.get(src).add(`w${u.searchParams.get("w")}/q${u.searchParams.get("q")}`);
  }
  return photos;
}

const devices = [
  { name: "phone (430px, DPR 3)", viewport: { width: 430, height: 932, mobile: true, dpr: 3 }, quickView: false },
  { name: "desktop (1366px, DPR 1)", viewport: { width: 1366, height: 768, mobile: false, dpr: 1 }, quickView: true },
];

for (const device of devices) {
  console.log(`\n── ${device.name}`);
  await session(device.viewport, async ({ ev, go, click, sleep, requests }) => {
    await go(`${BASE}/menu`);
    // Scroll the whole page the way a visitor would, so the lazy pictures and the look-ahead have a chance to load them.
    const height = await ev("document.documentElement.scrollHeight");
    for (let y = 0; y < height; y += Math.round(device.viewport.height * 0.6)) {
      await ev(`window.scrollTo({ top: ${y}, behavior: "instant" })`);
      await sleep(120);
    }
    await sleep(1000);

    const photos = variantsPerPhoto(requests);
    const total = [...photos.values()].reduce((n, s) => n + s.size, 0);
    const ratio = photos.size ? total / photos.size : 0;
    const doubled = [...photos.entries()].filter(([, s]) => s.size > 1).length;
    console.log(`      ${photos.size} product photos, ${total} variants requested, ${ratio.toFixed(2)} variants per photo, ${doubled} photos with more than one`);
    check(`${device.name}: enough product photos were requested to judge`, photos.size >= MIN_PHOTOS, `${photos.size} (need ${MIN_PHOTOS})`);
    check(`${device.name}: at most ${MAX_VARIANTS_PER_PHOTO} variants per product photo`, ratio <= MAX_VARIANTS_PER_PHOTO, `${ratio.toFixed(2)}`);

    const dialogs = JSON.parse(await ev(`JSON.stringify({ total: document.querySelectorAll("main dialog img").length, eager: [...document.querySelectorAll("main dialog img")].filter(i=>i.loading==="eager").length })`));
    check(`${device.name}: pictures in closed dialogs stay lazy`, dialogs.total > 0 && dialogs.eager === 0, `${dialogs.eager} of ${dialogs.total} eager`);

    if (device.quickView) {
      const first = `[...document.querySelectorAll("main article")].find(a=>a.querySelector("dialog img"))`;
      const img = `${first}.querySelector("dialog img")`;
      await ev(`window.scrollTo({ top: 0, behavior: "instant" })`);
      await sleep(600);
      const before = await ev(`${img}.complete`);
      const eye = `${first}.querySelector("button[aria-haspopup=dialog]")`;
      const opened = await click(eye);
      await sleep(1500);
      const after = JSON.parse(await ev(`JSON.stringify({ open: ${first}.querySelector("dialog").open, loaded: ${img}.complete && ${img}.naturalWidth > 0 })`));
      check(`${device.name}: the quick-view picture is not loaded before the window opens`, before === false, `complete=${before}`);
      check(`${device.name}: the quick-view window opens and its picture loads`, opened && after.open && after.loaded, JSON.stringify(after));
    }
  });
}

console.log(failures.length ? `\n${failures.length} check(s) FAILED` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
