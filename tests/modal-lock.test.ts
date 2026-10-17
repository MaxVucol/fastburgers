// Regression guard for "the page scrolls but no button reacts".
//
// A modal <dialog> left open in a page tree that the router then hides (a language change swaps the whole page;
// Back / Forward swap the page below the header) keeps blocking the document, or comes back open on Forward, while
// it is no longer shown. Every component that opens a modal must close it when its part of the page is hidden or
// removed (components/layout/use-close-on-hide.ts), unless it is listed here with the reason it is safe.
// The browser behaviour itself is checked by scripts/check-modal-lock.mjs (needs Chrome and a running site).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();

function* sources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

/** Components that call showModal() and do not use the hook, with why that is safe. */
const EXEMPT: Record<string, string> = {
  "components/cart/cart-drawer.tsx": "sits in the page layout and is opened and closed by the cart store, never left open by a link or a language change",
  "components/checkout/bank-dialog.tsx": "mounted only while it is open: removing it from the page removes the dialog",
  "components/admin/admin-shell.tsx": "admin area, no language switch inside a dialog",
};

const rel = (file: string) => path.relative(root, file).split(path.sep).join("/");

test("every storefront component that opens a modal closes it when its part of the page is hidden", () => {
  const offenders: string[] = [];
  for (const dir of ["components", "app"]) {
    for (const file of sources(path.join(root, dir))) {
      const name = rel(file);
      if (name.startsWith("app/admin") || name.endsWith("use-close-on-hide.ts")) continue;
      const text = readFileSync(file, "utf8");
      if (!/\.showModal\(/.test(text)) continue;
      if (/useCloseOnHide\(/.test(text) || name in EXEMPT) continue;
      offenders.push(name);
    }
  }
  assert.deepEqual(offenders, [], "these open a modal without useCloseOnHide(ref): a modal left behind blocks the next page");
});

test("the menu, the search window and both product-card windows use the hook", () => {
  const count = (file: string) => (readFileSync(path.join(root, file), "utf8").match(/useCloseOnHide\(/g) ?? []).length;
  assert.equal(count("components/layout/mobile-menu.tsx"), 1);
  assert.equal(count("components/layout/search-dialog.tsx"), 1);
  assert.equal(count("components/product/card-actions.tsx"), 2);
});

test("the hook closes an open dialog in its effect cleanup", () => {
  const text = readFileSync(path.join(root, "components/layout/use-close-on-hide.ts"), "utf8");
  assert.match(text, /useEffect\(\(\) => \{[\s\S]*const dialog = ref\.current;[\s\S]*return \(\) => \{[\s\S]*dialog\?\.open[\s\S]*dialog\.close\(\)/);
});

test("choosing a language inside the phone menu closes that menu before navigating", () => {
  const text = readFileSync(path.join(root, "components/layout/language-switcher.tsx"), "utf8");
  const close = text.indexOf('closest("dialog")?.close()');
  const push = text.indexOf("router.push(");
  assert.ok(close > 0 && push > 0 && close < push, "the dialog must be closed before router.push");
});
