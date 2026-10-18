// Brings the Romanian product names in a database in line with prisma/pizzamania-menu.json (matched by slug).
// Only the `name` field of products that already exist is changed: no prices, photos, slugs or anything else.
//
//   npx tsx scripts/sync-product-names.ts            → dry run: lists the names that would change
//   npx tsx scripts/sync-product-names.ts --apply    → writes them
// Uses DATABASE_URL from the environment / .env (add --env-file=.env.atlas for Atlas). Never prints the
// connection string. After a change on the live database the site needs a redeploy or an admin save,
// because catalogue reads are cached.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const menu: { products: { slug: string; name: string }[] } = JSON.parse(readFileSync("prisma/pizzamania-menu.json", "utf8"));
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
  console.log(`${apply ? "APPLY" : "DRY RUN"} on database host: ${host}`);
  const rows = await prisma.product.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  let changed = 0;
  let missing = 0;
  for (const p of menu.products) {
    const row = bySlug.get(p.slug);
    if (!row) {
      missing++;
      continue;
    }
    if (row.name === p.name) continue;
    changed++;
    console.log(`  ${p.slug}: "${row.name}" -> "${p.name}"`);
    if (apply) await prisma.product.update({ where: { id: row.id }, data: { name: p.name } });
  }
  console.log(`${changed} name(s) ${apply ? "updated" : "would change"}; ${missing} menu slug(s) not in this database.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
