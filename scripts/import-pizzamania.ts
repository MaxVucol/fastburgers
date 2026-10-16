// Adds the catalogue built by scripts/pizzamania-build.mjs (prisma/pizzamania-menu.json) to an EXISTING
// database without touching anything else: only categories and products whose slug does not exist yet
// are created. Safe to run more than once.
//
//   npx tsx scripts/import-pizzamania.ts            → dry run: lists what would be created
//   npx tsx scripts/import-pizzamania.ts --apply    → creates it
//   add --replace to also DELETE every product that is not in the menu file (the old catalogue, with its
//   options and favourites); categories are never deleted. Order history keeps its own snapshots.
// With --apply every photo must already be uploaded (scripts/upload-pizzamania-images.mjs).
//
// Uses DATABASE_URL from the environment / .env. Never prints the connection string.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

type Menu = {
  categories: { slug: string; name: string; active: boolean }[];
  products: {
    slug: string;
    name: string;
    category: string;
    price: number;
    weight: number | null;
    weightUnit: "g" | "ml";
    description: string;
    image: string | null;
    imageUrl?: string;
  }[];
};

const menu: Menu = JSON.parse(readFileSync("prisma/pizzamania-menu.json", "utf8"));
const apply = process.argv.includes("--apply");
const replace = process.argv.includes("--replace");
const prisma = new PrismaClient();

async function main() {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname || "?";
    } catch {
      return "?";
    }
  })();
  console.log(`${apply ? "APPLY" : "DRY RUN"} · database host: ${host === "127.0.0.1" || host === "localhost" ? "local" : "remote"}`);

  const categories = await prisma.category.findMany({ select: { id: true, slug: true, order: true } });
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  let order = Math.max(-1, ...categories.map((c) => c.order)) + 1;

  for (const c of menu.categories) {
    if (bySlug.has(c.slug)) continue;
    console.log(`+ category ${c.slug}${c.active ? "" : " (hidden)"}`);
    if (apply) {
      const created = await prisma.category.create({
        data: { slug: c.slug, name: c.name, description: "", image: null, order: order++, active: c.active },
      });
      bySlug.set(c.slug, created.id);
    } else bySlug.set(c.slug, "(new)");
  }

  const hidden = new Set(menu.categories.filter((c) => !c.active).map((c) => c.slug));
  if (apply && menu.products.some((p) => p.image && !p.imageUrl)) {
    throw new Error("Some photos are not uploaded yet: run scripts/upload-pizzamania-images.mjs --apply first.");
  }

  // The old catalogue: every product that is not part of the menu file. Favourites of those products
  // go with them and price-comparison rows are detached; past orders keep their own snapshots.
  const menuSlugs = new Set(menu.products.map((p) => p.slug));
  const current = await prisma.product.findMany({ select: { id: true, slug: true } });
  const stale = replace ? current.filter((p) => !menuSlugs.has(p.slug)) : [];
  if (replace) console.log(`- ${stale.length} existing products ${apply ? "deleted" : "would be deleted"}`);
  if (apply && stale.length) {
    const ids = stale.map((p) => p.id);
    await prisma.favorite.deleteMany({ where: { productId: { in: ids } } });
    await prisma.competitorPrice.updateMany({ where: { productId: { in: ids } }, data: { productId: null } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  }
  const staleIds = new Set(stale.map((p) => p.id));
  const kept = current.filter((p) => !staleIds.has(p.id));

  const existing = new Set(kept.map((p) => p.slug));
  let sortOrder = kept.length;
  let created = 0;
  for (const p of menu.products) {
    if (existing.has(p.slug)) {
      console.log(`= ${p.slug} exists, skipped`);
      continue;
    }
    const categoryId = bySlug.get(p.category);
    if (!categoryId) throw new Error(`Category ${p.category} does not exist`);
    created++;
    if (apply) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          shortDescription: p.description,
          price: p.price,
          image: p.imageUrl ?? "",
          images: p.imageUrl ? [p.imageUrl] : [],
          ingredients: [],
          allergens: [],
          weight: p.weight,
          weightUnit: p.weightUnit,
          categoryId,
          active: !hidden.has(p.category),
          sortOrder: sortOrder++,
        },
      });
    }
  }
  console.log(`${apply ? "Created" : "Would create"} ${created} products.`);
  if (!apply) console.log("Nothing written. Re-run with --apply to create the items above.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
