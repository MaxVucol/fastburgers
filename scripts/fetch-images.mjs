// Downloads the demo photography (Unsplash License — free for commercial use)
// and normalizes it into /public/images. Run: node scripts/fetch-images.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images");

/** target path (relative to /public/images) -> Unsplash photo id */
const IMAGES = {
  "products/classic-smash/main.webp": "1607013251379-e6eecfffe234",
  "products/classic-smash/2.webp": "1568901346375-23c9450c58cd",
  "products/double-cheese/main.webp": "1572802419224-296b0aeee0d9",
  "products/double-cheese/2.webp": "1586190848861-99aa4a171e90",
  "products/bbq-bacon/main.webp": "1553979459-d2229ba7433b",
  "products/bbq-bacon/2.webp": "1550317138-10000687a72b",
  "products/crispy-chicken/main.webp": "1606755962773-d324e0a13086",
  "products/crispy-chicken/2.webp": "1615297928064-24977384d0da",
  "products/margherita/main.webp": "1574071318508-1cdbab80d002",
  "products/pepperoni/main.webp": "1628840042765-356cda07504e",
  "products/bbq-chicken-pizza/main.webp": "1565299624946-b28f40a0ae38",
  "products/four-cheese/main.webp": "1513104890138-7c749659a591",
  "products/crispy-tenders/main.webp": "1562967914-608f82629710",
  "products/hot-wings/main.webp": "1608039755401-742074f0548d",
  "products/hot-wings/2.webp": "1567620832903-9fc6debc209f",
  "products/chicken-box/main.webp": "1626082927389-6cd097cdc6ec",
  "products/crispy-chicken-wrap/main.webp": "1626700051175-6818013e1d4f",
  "products/bbq-beef-wrap/main.webp": "1665469222949-3de88d37ee5a",
  "products/classic-combo/main.webp": "1594212699903-ec8a3eca50f5",
  "products/double-burger-combo/main.webp": "1550547660-d9450f859349",
  "products/chicken-combo/main.webp": "1637926704492-d4e33859b0ab",
  "products/classic-fries/main.webp": "1585109649139-366815a0d713",
  "products/classic-fries/2.webp": "1630384060421-cb20d0e0649d",
  "products/cheesy-fries/main.webp": "1639744210631-209fce3e256c",
  "products/loaded-fries/main.webp": "1485962398705-ef6a13c41e8f",
  "products/chocolate-brownie/main.webp": "1606313564200-e75d5e30476c",
  "products/cheesecake/main.webp": "1533134242443-d4fd215305ad",
  "products/cookie/main.webp": "1499636136210-6f4ee915583e",
  "products/coca-cola/main.webp": "1622483767028-3f66f32aef97",
  "products/fanta/main.webp": "1624517452488-04869289c4ca",
  "products/sprite/main.webp": "1690988109041-458628590a9e",
  "products/lemonade/main.webp": "1621263764928-df1444c5e859",
  "products/milkshake/main.webp": "1579954115545-a95591f28bfc",
  "categories/burgeri.webp": "1568901346375-23c9450c58cd",
  "categories/pizza.webp": "1628840042765-356cda07504e",
  "categories/chicken.webp": "1626082927389-6cd097cdc6ec",
  "categories/wraps.webp": "1626700051175-6818013e1d4f",
  "categories/cartofi.webp": "1585109649139-366815a0d713",
  "categories/combo.webp": "1594212699903-ec8a3eca50f5",
  "categories/deserturi.webp": "1533134242443-d4fd215305ad",
  "categories/bauturi.webp": "1579954115545-a95591f28bfc",
  "hero/hero.webp": "1561758033-d89a9ad46330",
  "promo/promo.webp": "1571091718767-18b5b1457add",
};

async function fetchOne(target, id) {
  const isCategory = target.startsWith("categories/");
  const [w, h] = isCategory ? [800, 800] : [1600, 1200];
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=2000&q=90&fm=jpg`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const out = await sharp(input)
    .resize(w, h, { fit: "cover", position: "attention" })
    // A gentle, uniform grade so photos from different shoots read as one set.
    .modulate({ saturation: 1.06, brightness: 1.02 })
    .webp({ quality: 82 })
    .toBuffer();
  const file = path.join(OUT, target);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log("ok", target);
}

const entries = Object.entries(IMAGES);
for (let i = 0; i < entries.length; i += 6) {
  await Promise.all(entries.slice(i, i + 6).map(([t, id]) => fetchOne(t, id)));
}
