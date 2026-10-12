// Adds the proposed draft dishes (prisma/menu-drafts.ts) to an EXISTING database without touching
// anything else: only categories and products whose slug does not exist yet are created, always
// hidden (category inactive; product draft + inactive, no photo). Safe to run more than once.
//
//   npx tsx scripts/add-menu-drafts.ts            → dry run: lists what would be created
//   npx tsx scripts/add-menu-drafts.ts --apply    → creates it
//
// Uses DATABASE_URL from the environment / .env. Never prints the connection string.
import { PrismaClient } from "@prisma/client";
import { draftCategories, draftProducts } from "../prisma/menu-drafts";

const apply = process.argv.includes("--apply");
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

  for (const c of draftCategories) {
    if (bySlug.has(c.slug)) continue;
    console.log(`+ category ${c.slug} (hidden)`);
    if (apply) {
      const created = await prisma.category.create({ data: { ...c, image: null, order: order++, active: false } });
      bySlug.set(c.slug, created.id);
    } else bySlug.set(c.slug, "(new)");
  }

  const existing = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  let sortOrder = await prisma.product.count();
  for (const d of draftProducts) {
    if (existing.has(d.slug)) {
      console.log(`= ${d.slug} exists, skipped`);
      continue;
    }
    const categoryId = bySlug.get(d.category);
    if (!categoryId) throw new Error(`Category ${d.category} does not exist`);
    console.log(`+ draft ${d.slug} · ${(d.price / 100).toFixed(2)} MDL`);
    if (apply) {
      await prisma.product.create({
        data: {
          name: d.name,
          slug: d.slug,
          description: d.description,
          shortDescription: d.shortDescription,
          price: d.price,
          image: "",
          images: [],
          ingredients: d.ingredients,
          allergens: [],
          weight: d.weight,
          weightUnit: d.weightUnit ?? "g",
          categoryId,
          spicy: d.spicy ?? false,
          draft: true,
          active: false,
          sortOrder: sortOrder++,
        },
      });
    }
  }
  if (!apply) console.log("Nothing written. Re-run with --apply to create the items above.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
