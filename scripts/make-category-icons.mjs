// Category pictures for the header row and the menu.
//   node scripts/make-category-icons.mjs          → converts new source PNGs, rebuilds the list
//   node scripts/make-category-icons.mjs --all    → converts every source PNG again
//
// Put a transparent PNG for a category in public/images/categories/ named after it ("Supe.png",
// "Mic dejun.png": spaces and case do not matter, the name is turned into the category slug). It is
// converted to a 144 px high WebP in public/images/categories/icons/<slug>.webp, and
// lib/category-icons.json (slug → file and pixel width, plus the large home-page picture) is rebuilt
// from what is in that folder.
// The all-categories picture is "Toate categoriile.png" (key "all").
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "public/images/categories";
const ICONS = `${SOURCE}/icons`;
const HEIGHT = 144;
const SHOWCASE = `${SOURCE}/showcase`;
const SHOWCASE_SIZE = 800;
/** Source name (lower case, dashes) → category slug, where they differ. */
const ALIASES = { burger: "burgeri", "combo-uri": "combo", "toate-categoriile": "toate", "poke-bowl": "poke" };
/** Icon file name → key used by the tabs. */
const KEYS = { toate: "all" };

const slugOf = (file) => {
  const name = path.parse(file).name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, "-");
  return ALIASES[name] ?? name;
};

const all = process.argv.includes("--all");
await mkdir(SHOWCASE, { recursive: true });
for (const file of (await readdir(SOURCE)).filter((f) => f.toLowerCase().endsWith(".png"))) {
  const slug = slugOf(file);
  const target = `${ICONS}/${slug}.webp`;
  if (all || !existsSync(target)) {
    await sharp(`${SOURCE}/${file}`).resize({ height: HEIGHT }).webp({ quality: 86, alphaQuality: 92 }).toFile(target);
    console.log(`${file} → icons/${slug}.webp`);
  }
  // The large picture of the home page (shown beside the category list).
  const big = `${SHOWCASE}/${slug}.webp`;
  if (slug !== "toate" && (all || !existsSync(big))) {
    await sharp(`${SOURCE}/${file}`).resize({ width: SHOWCASE_SIZE, height: SHOWCASE_SIZE, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, alphaQuality: 90 }).toFile(big);
    console.log(`${file} → showcase/${slug}.webp`);
  }
}

const manifest = {};
for (const file of (await readdir(ICONS)).filter((f) => f.endsWith(".webp")).sort()) {
  const slug = path.parse(file).name;
  const { width } = await sharp(`${ICONS}/${file}`).metadata();
  const entry = { src: `/images/categories/icons/${file}`, width };
  if (existsSync(`${SHOWCASE}/${file}`)) entry.showcase = `/images/categories/showcase/${file}`;
  manifest[KEYS[slug] ?? slug] = entry;
}
await writeFile("lib/category-icons.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`${Object.keys(manifest).length} icons listed in lib/category-icons.json`);
