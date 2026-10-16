// Builds the catalogue import from the public menu API of the previous brand's site (Pizza Mania):
//   node scripts/pizzamania-build.mjs [--images]
// Writes prisma/pizzamania-menu.json (Romanian rows for the database) and lib/i18n/catalog-pizzamania.ts
// (Russian copy by slug). With --images it also downloads every photo into
// public/images/products/<slug>/main.webp. It reads only the public API; nothing is written to a database
// (see scripts/import-pizzamania.ts for that).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const API = "https://strapi.pizzamania.md";
const withImages = process.argv.includes("--images");

/** API category key → site category. Several source sections can share one category. */
const CATEGORIES = [
  { slug: "pizza", existing: true, keys: ["pizza"] },
  { slug: "burgeri", existing: true, keys: ["burgers"] },
  { slug: "deserturi", existing: true, keys: ["dessert"] },
  { slug: "bauturi", existing: true, keys: ["cold_drinks", "buble_tea", "fresh_juice"] },
  { slug: "mic-dejun", ro: "Mic dejun", ru: "Завтрак", keys: ["breakfast"] },
  { slug: "pranz-business", ro: "Prânz business", ru: "Бизнес-ланч", keys: ["bl"] },
  { slug: "supe", ro: "Supe", ru: "Супы", keys: ["soups"] },
  { slug: "salate", ro: "Salate", ru: "Салаты", keys: ["salads"] },
  { slug: "poke", ro: "Poke bowl", ru: "Поке боллы", keys: ["poke_balls"] },
  { slug: "garnituri", ro: "Garnituri", ru: "Гарниры", keys: ["garnish"] },
  { slug: "preparate-calde", ro: "Preparate calde", ru: "Горячие блюда", keys: ["hot_dishes"] },
  { slug: "paste", ro: "Paste", ru: "Паста", keys: ["paste"] },
  { slug: "paine", ro: "Pâine", ru: "Хлеб", keys: ["bread"] },
  { slug: "sosuri", ro: "Sosuri", ru: "Соусы", keys: ["sauces"] },
  { slug: "toppinguri", ro: "Toppinguri", ru: "Топпинги", keys: ["toppings", "sweet_toppings"] },
  { slug: "la-bere", ro: "La bere", ru: "К пиву", keys: ["for_beer"] },
  { slug: "cafea", ro: "Cafea", ru: "Кофе", keys: ["coffee", "supplements"] },
  {
    slug: "bar",
    ro: "Bar",
    ru: "Бар",
    keys: ["beer_bottle", "beer_on_tap", "cocktails", "vin_la_sticla", "vin_la_pahar", "vin_la_litru", "vin_spumat", "vodca", "divin", "wiskey", "tequila", "gin", "rom", "liquer", "aperitiv"],
  },
  // Banquet menu: ordered for events, not online; kept hidden until the owner decides.
  {
    slug: "meniu-banchet",
    ro: "Meniu de banchet",
    ru: "Банкетное меню",
    hidden: true,
    keys: ["meniu_de_banchet_gustari_reci", "meniu_de_banchet_salate", "meniu_de_banchet_gustari_calde", "meniu_de_banchet_torturi", "meniu_de_banchet_bauturi"],
  },
];

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

async function fetchAll() {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/api/products?populate=*&pagination[pageSize]=100&pagination[page]=${page}&sort=id`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    all.push(...json.data);
    if (page >= json.meta.pagination.pageCount) return all;
  }
}

async function reservedSlugs() {
  const found = new Set();
  for (const file of ["prisma/seed.ts", "prisma/menu-drafts.ts"]) {
    for (const m of (await readFile(file, "utf8")).matchAll(/slug: "([a-z0-9-]+)"/g)) found.add(m[1]);
  }
  return found;
}

const lead = (s) => s.trim().replace(/\s+/g, " ");
const unitWord = { ro: { gram: "g", ml: "ml" }, ru: { gram: "г", ml: "мл" } };

const source = await fetchAll();
const reserved = await reservedSlugs();
const catOf = new Map(CATEGORIES.flatMap((c) => c.keys.map((k) => [k, c])));
const unknown = [...new Set(source.map((p) => p.category))].filter((k) => !catOf.has(k));
if (unknown.length) throw new Error(`Unmapped categories: ${unknown.join(", ")}`);

// One row per orderable size: an item with sizes becomes one product per size.
const rows = [];
for (const p of source) {
  const unit = p.unit === "ml" ? "ml" : "gram";
  const sizes = p.options?.length
    ? p.options.map((o) => ({ price: o.price, weight: String(o.weight), sized: true }))
    : [{ price: p.price, weight: p.weight, sized: false }];
  for (const s of sizes) {
    if (s.price == null) throw new Error(`No price: ${p.title.ro}`);
    const raw = s.weight ? String(s.weight).trim() : "";
    const parts = raw.split("/").map((x) => parseInt(x, 10)).filter(Number.isFinite);
    rows.push({
      src: p,
      cat: catOf.get(p.category),
      unit,
      sized: s.sized,
      price: Math.round(Number(s.price) * 100),
      weight: parts.length ? parts.reduce((a, b) => a + b, 0) : null,
      raw: parts.length > 1 ? raw : "",
      size: s.sized && parts.length ? `${parts[0]} ${unitWord.ro[unit]}` : "",
      sizeRu: s.sized && parts.length ? `${parts[0]} ${unitWord.ru[unit]}` : "",
    });
  }
}

// Same name twice in one category (e.g. the same water in two bottle sizes): the size goes into the name.
const seen = new Map();
for (const r of rows) {
  const k = `${r.cat.slug}|${lead(r.src.title.ro)}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const taken = new Set(reserved);
const products = rows.map((r) => {
  const key = `${r.cat.slug}|${lead(r.src.title.ro)}`;
  const addSize = (r.sized || seen.get(key) > 1) && r.weight;
  const size = r.size || `${r.weight} ${unitWord.ro[r.unit]}`;
  const sizeRu = r.sizeRu || `${r.weight} ${unitWord.ru[r.unit]}`;
  const name = addSize ? `${lead(r.src.title.ro)} ${size}` : lead(r.src.title.ro);
  const nameRu = addSize ? `${lead(r.src.title.ru)} ${sizeRu}` : lead(r.src.title.ru);
  let slug = slugify(name);
  if (taken.has(slug)) slug = slugify(`${name}-${r.cat.slug}`);
  for (let i = 2; taken.has(slug); i++) slug = `${slugify(name)}-${i}`;
  taken.add(slug);
  const portion = r.raw ? { ro: `Porție: ${r.raw} ${unitWord.ro[r.unit]}`, ru: `Порция: ${r.raw} ${unitWord.ru[r.unit]}` } : null;
  const join = (text, extra) => [lead(text ?? ""), extra].filter(Boolean).join(" ");
  const image = r.src.image?.url ?? null;
  return {
    slug,
    name,
    nameRu,
    category: r.cat.slug,
    price: r.price,
    weight: r.weight,
    weightUnit: r.unit === "ml" ? "ml" : "g",
    description: join(r.src.description?.ro, portion?.ro),
    descriptionRu: join(r.src.description?.ru, portion?.ru),
    image,
    sourceId: r.src.id,
  };
});

const categories = CATEGORIES.filter((c) => !c.existing).map((c) => ({ slug: c.slug, name: c.ro, nameRu: c.ru, active: !c.hidden }));
await writeFile("prisma/pizzamania-menu.json", JSON.stringify({ categories, products }, null, 1) + "\n");

const q = (s) => JSON.stringify(s);
const ts = [
  "// Russian copy for the catalogue imported from the previous brand's menu (scripts/pizzamania-build.mjs).",
  "// Generated: do not edit by hand. Keyed by slug like the rest of catalog-translations.ts.",
  "",
  "export const pizzamaniaRu = {",
  "  categories: {",
  ...categories.map((c) => `    ${q(c.slug)}: { name: ${q(c.nameRu)}, description: "" },`),
  "  } as Record<string, { name: string; description: string }>,",
  "  products: {",
  ...products.map((p) => `    ${q(p.slug)}: { short: ${q(p.descriptionRu)}, description: ${q(p.descriptionRu)}, ingredients: [] },`),
  "  } as Record<string, { short: string; description: string; ingredients: string[] }>,",
  "};",
  "",
].join("\n");
await writeFile("lib/i18n/catalog-pizzamania.ts", ts);

console.log(`${products.length} products from ${source.length} source items; ${categories.length} new categories; ${products.filter((p) => !p.image).length} without a photo`);

if (withImages) {
  let done = 0;
  const queue = products.filter((p) => p.image);
  async function worker() {
    for (let p; (p = queue.shift()); ) {
      const res = await fetch(`${API}${p.image}`);
      if (!res.ok) throw new Error(`Image ${res.status}: ${p.slug}`);
      const dir = `public/images/products/${p.slug}`;
      await mkdir(dir, { recursive: true });
      await sharp(Buffer.from(await res.arrayBuffer())).webp({ quality: 82 }).toFile(`${dir}/main.webp`);
      done++;
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`${done} photos written`);
}
