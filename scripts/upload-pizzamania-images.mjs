// Uploads the product photos prepared by scripts/pizzamania-build.mjs --images
// (public/images/products/<slug>/main.webp) to Vercel Blob and records each public URL in
// prisma/pizzamania-menu.json (field `imageUrl`). Safe to run again: the same path is overwritten.
//
//   node --env-file=.env scripts/upload-pizzamania-images.mjs            → dry run (counts only)
//   node --env-file=.env scripts/upload-pizzamania-images.mjs --apply    → uploads
//
// Needs BLOB_READ_WRITE_TOKEN in the environment. The token is never printed.
import { readFile, writeFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const apply = process.argv.includes("--apply");
const menu = JSON.parse(await readFile("prisma/pizzamania-menu.json", "utf8"));
const todo = menu.products.filter((p) => p.image);

console.log(`${apply ? "APPLY" : "DRY RUN"} · ${todo.length} photos · token ${process.env.BLOB_READ_WRITE_TOKEN ? "present" : "MISSING"}`);
if (!apply) process.exit(0);
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is not set (put it in .env).");
  process.exit(1);
}

const queue = [...todo];
let done = 0;
async function worker() {
  for (let p; (p = queue.shift()); ) {
    const body = await readFile(`public/images/products/${p.slug}/main.webp`);
    const blob = await put(`products/${p.slug}/main.webp`, body, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    p.imageUrl = blob.url;
    done++;
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

await writeFile("prisma/pizzamania-menu.json", JSON.stringify(menu, null, 1) + "\n");
console.log(`${done} photos uploaded; URLs saved to prisma/pizzamania-menu.json`);
