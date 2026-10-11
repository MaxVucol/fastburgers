// Downloads the demo photography (Unsplash License — free for commercial use)
// and normalizes it into /public/images.
//   node scripts/fetch-images.mjs                 → every image
//   node scripts/fetch-images.mjs hero/ products/sprite/main.webp   → only targets starting with these prefixes
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images");

/**
 * target path (relative to /public/images) -> Unsplash photo id, or [id, options].
 * options.position: sharp crop gravity ("attention" by default, or e.g. "south", "centre").
 * options.focus: [x, y, zoom?] — x/y in 0–1 place the crop window inside the overflow (0 = left/top, 1 = right/bottom);
 *   used for tall shots where neither "north" nor "centre" keeps the whole burger in frame. zoom > 1 crops tighter,
 *   e.g. to leave a third-party brand or packaging in the background out of the shot.
 * options.size: [width, height] — defaults to 1600×1200 (4:3) for products, 800×800 for categories.
 * options.grade: false skips the shared colour grade (the hero keeps the photographer's own grade).
 * options.quality: output quality (default 82 WebP / 84 JPEG).
 * The author (Unsplash username) is noted where it is known.
 */
const IMAGES = {
  // ── Burgers ───────────────────────────────────────────────
  "products/classic-smash/main.webp": "1607013251379-e6eecfffe234",
  "products/classic-smash/2.webp": "1568901346375-23c9450c58cd",
  "products/double-cheese/main.webp": "1572802419224-296b0aeee0d9",
  "products/double-cheese/2.webp": ["1639020715088-e7afebe6cb25", { position: "centre" }], // @manu-ros
  // Beef, bacon, cheddar and onion rings — the dish as described.
  "products/bbq-bacon/main.webp": ["1683882330385-e9270342b306", { focus: [0.5, 0.6, 1.25] }], // @ryan-concepcion
  "products/bbq-bacon/2.webp": ["1648221410814-9d45c9ab144b", { focus: [0.5, 0.55] }], // @ta-focando
  "products/crispy-chicken/main.webp": "1606755962773-d324e0a13086",
  "products/crispy-chicken/2.webp": ["1692737349870-e3bfc704ebf9", { position: "centre" }], // @david-foodphototasty
  // ── Pizza ─────────────────────────────────────────────────
  "products/margherita/main.webp": "1574071318508-1cdbab80d002",
  "products/pepperoni/main.webp": "1628840042765-356cda07504e",
  // products/bbq-chicken-pizza/main.webp is a drawn placeholder, not fetched: the only photo found
  // (1565299624946-b28f40a0ae38) shows pineapple, which this pizza does not have.
  "products/four-cheese/main.webp": "1513104890138-7c749659a591",
  // ── Chicken ───────────────────────────────────────────────
  // Close-up of breaded strips around a creamy herb dip — sharp, no third-party packaging in frame.
  "products/crispy-tenders/main.webp": ["1562967914-608f82629710", { focus: [0.425, 0.681, 1.4775] }], // @leo-roza
  "products/hot-wings/main.webp": "1567620832903-9fc6debc209f",
  "products/hot-wings/2.webp": ["1780037384670-63862da64775", { position: "centre" }], // @allen-y
  "products/chicken-box/main.webp": ["1580217593608-61931cefc821", { position: "centre" }], // @andy-wang
  // ── Wraps ─────────────────────────────────────────────────
  "products/crispy-chicken-wrap/main.webp": "1626700051175-6818013e1d4f",
  "products/bbq-beef-wrap/main.webp": "1665469222949-3de88d37ee5a",
  // ── Combos ────────────────────────────────────────────────
  "products/classic-combo/main.webp": "1594212699903-ec8a3eca50f5",
  "products/double-burger-combo/main.webp": ["1571805618149-3a772570ebcd", { position: "centre" }], // @peter-dawn
  "products/chicken-combo/main.webp": ["1551782450-17144efb9c50", { position: "centre" }], // @sk
  // ── Fries ─────────────────────────────────────────────────
  "products/classic-fries/main.webp": "1630384060421-cb20d0e0649d",
  "products/classic-fries/2.webp": ["1688978181542-87a886a16fbe", { position: "centre" }], // @durenne-loris
  "products/cheesy-fries/main.webp": ["1609530127564-bee93ebe1c9e", { position: "centre" }], // @christine-von-raesfeld
  "products/loaded-fries/main.webp": "1485962398705-ef6a13c41e8f",
  // ── Desserts ──────────────────────────────────────────────
  "products/chocolate-brownie/main.webp": "1606313564200-e75d5e30476c",
  "products/cheesecake/main.webp": "1533134242443-d4fd215305ad",
  "products/cookie/main.webp": "1499636136210-6f4ee915583e",
  // ── Drinks ────────────────────────────────────────────────
  "products/coca-cola/main.webp": ["1581098365948-6a5a912b7a49", { position: "centre" }],
  // Regular Fanta Orange (the previous shot was Fanta Zero). Temporary until an in-house product shot exists.
  "products/fanta/main.webp": ["1787453712989-3bf7db8211c4", { focus: [0.62, 0.5, 1.6] }], // @erik-mclean
  "products/sprite/main.webp": ["1680404005217-a441afdefe83", { position: "centre" }], // @miheer-tewari
  "products/lemonade/main.webp": "1621263764928-df1444c5e859",
  "products/milkshake/main.webp": "1579954115545-a95591f28bfc",
  // ── Category tiles (each its own shot, never a product photo) ──
  // categories/burgeri.webp is supplied by the project owner, not fetched: their 1448×1086 shot set on a
  // slightly taller (0.69:1) backdrop, so the burger fills the tall desktop panel like the other category shots.
  // categories/pizza.webp is supplied by the project owner (1122×1402, converted as is), not fetched.
  // categories/chicken.webp is supplied by the project owner (1122×1402, converted as is), not fetched.
  // categories/wraps.webp is supplied by the project owner (1122×1402, converted as is), not fetched.
  // categories/cartofi.webp is supplied by the project owner (1122×1402, converted as is), not fetched.
  // categories/combo.webp is supplied by the project owner (1122×1402, converted as is), not fetched.
  // categories/deserturi.webp is supplied by the project owner (1024×1536, converted as is), not fetched.
  // categories/bauturi.webp is supplied by the project owner (1024×1536, converted as is), not fetched.
  // ── Campaign ──────────────────────────────────────────────
  // Full width of the original (5000×7336), 0.9:1 so the whole burger fits every panel shape from phones
  // (≈1.1:1) to 1920px desktops (≈1.35:1); 2400px wide covers the 1–2x desktop panel without upscaling.
  // hero/cheeseburger.webp (the first-screen photo) is supplied by the project owner (1774×887,
  // converted as is), not fetched; a new file name keeps browsers from showing a cached older photo.
  // Social preview (Open Graph / Twitter): 1.91:1, JPEG for the widest crawler support.
  "hero/og.jpg": ["1586816001966-79b736744398", { size: [1200, 630], position: "centre" }], // @mafe-estudio
  "promo/promo.webp": ["1551782450-a2132b4ba21d", { position: "centre" }], // @sk
};

/** Scale to cover w×h, then cut the w×h window at the given focus. */
async function cropAt(input, w, h, [fx, fy, zoom = 1]) {
  const { width, height } = await sharp(input).metadata();
  const scale = Math.max(w / width, h / height) * zoom;
  const sw = Math.max(w, Math.round(width * scale));
  const sh = Math.max(h, Math.round(height * scale));
  const scaled = await sharp(input).resize(sw, sh, { fit: "fill" }).toBuffer();
  return sharp(scaled)
    .extract({ left: Math.round(fx * (sw - w)), top: Math.round(fy * (sh - h)), width: w, height: h })
    .toBuffer();
}

async function fetchOne(target, entry) {
  const [id, opts = {}] = Array.isArray(entry) ? entry : [entry];
  const isCategory = target.startsWith("categories/");
  const [w, h] = opts.size ?? (isCategory ? [800, 800] : [1600, 1200]);
  // Tighter crops need a larger source so the final pixels are not upscaled.
  const sourceWidth = Math.min(6000, Math.round(2400 * (opts.focus?.[2] ?? 1)));
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=${sourceWidth}&q=90&fm=jpg`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  let pipeline = sharp(opts.focus ? await cropAt(input, w, h, opts.focus) : input).resize(w, h, {
    fit: "cover",
    position: opts.position ?? "attention",
  });
  // A gentle, uniform grade so photos from different shoots read as one set.
  if (opts.grade !== false) pipeline = pipeline.modulate({ saturation: 1.06, brightness: 1.02 });
  const out = target.endsWith(".jpg")
    ? await pipeline.jpeg({ quality: opts.quality ?? 84, mozjpeg: true }).toBuffer()
    : await pipeline.webp({ quality: opts.quality ?? 82 }).toBuffer();
  const file = path.join(OUT, target);
  // Targets are fixed keys above; never write outside /public/images.
  if (!file.startsWith(OUT + path.sep)) throw new Error(`refusing to write outside ${OUT}: ${target}`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log("ok", target);
}

const only = process.argv.slice(2);
const entries = Object.entries(IMAGES).filter(([t]) => only.length === 0 || only.some((p) => t.startsWith(p)));
if (entries.length === 0) {
  console.error(`No targets match: ${only.join(" ")}`);
  process.exit(1);
}
for (let i = 0; i < entries.length; i += 6) {
  await Promise.all(entries.slice(i, i + 6).map(([t, e]) => fetchOne(t, e)));
}
