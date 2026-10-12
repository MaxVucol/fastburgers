import "server-only";
import { z } from "zod";
import type { OfferType, PriceSourceType } from "@prisma/client";
import { parseCsv } from "@/lib/csv";
import { formatPrice, parsePriceToBani } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { audit, type AuditActor } from "@/services/audit";

// Competitor prices: entered by hand or imported from CSV by an administrator (no scraping).
// Internal data — never read by public pages.

/** Older than this, a check is flagged as stale. */
export const STALE_DAYS = 90;
/** A benchmark needs at least this many comparable offers. */
export const MIN_COMPARABLES = 2;

export const competitorInputSchema = z.object({
  restaurant: z.string().trim().min(2, "Restaurant").max(80),
  itemName: z.string().trim().min(2, "Produs").max(120),
  category: z.string().trim().min(2, "Categorie").max(60),
  price: z.number({ error: "Preț invalid" }).int().min(100, "Preț invalid").max(10_000_000, "Preț invalid"),
  size: z.string().trim().max(60).nullable(),
  offerType: z.enum(["SINGLE", "COMBO"], { error: "Tip: SINGLE sau COMBO" }),
  sourceType: z.enum(["RESTAURANT_SITE", "AGGREGATOR"], { error: "Sursă: RESTAURANT_SITE sau AGGREGATOR" }),
  sourceUrl: z.url({ protocol: /^https?$/, error: "URL invalid" }).max(400),
  checkedAt: z.date({ error: "Dată invalidă" }).refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, "Data este în viitor"),
  notes: z.string().trim().max(500).nullable(),
  productId: z.string().regex(/^[a-f0-9]{24}$/i).nullable(),
});
export type CompetitorInput = z.infer<typeof competitorInputSchema>;

export function listCompetitorPrices(filters: { productId?: string; q?: string } = {}) {
  const q = filters.q?.trim();
  return prisma.competitorPrice.findMany({
    where: {
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(q
        ? { OR: [{ restaurant: { contains: q, mode: "insensitive" } }, { itemName: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ category: "asc" }, { restaurant: "asc" }, { itemName: "asc" }],
  });
}

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/**
 * Per BUNIQ product: its price next to the competitor offers an administrator linked to it.
 * The benchmark (median) is computed only from linked offers of the same kind (single vs combo)
 * and only when there are at least MIN_COMPARABLES of them; otherwise it is null and flagged.
 */
export async function marketOverview(now = Date.now()) {
  const [products, offers] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ category: { order: "asc" } }, { sortOrder: "asc" }],
      select: { id: true, name: true, price: true, weight: true, weightUnit: true, active: true, draft: true, category: { select: { name: true, slug: true } } },
    }),
    prisma.competitorPrice.findMany({ where: { productId: { not: null } } }),
  ]);
  return products.map((p) => {
    const kind: OfferType = p.category.slug === "combo" ? "COMBO" : "SINGLE";
    const linked = offers.filter((o) => o.productId === p.id && o.offerType === kind);
    const prices = linked.map((o) => o.price);
    const lastChecked = linked.length ? new Date(Math.max(...linked.map((o) => o.checkedAt.getTime()))) : null;
    const benchmark = linked.length >= MIN_COMPARABLES ? median(prices) : null;
    return {
      ...p,
      kind,
      offers: linked,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
      benchmark,
      /** BUNIQ price relative to the benchmark, in percent (negative: cheaper). */
      gap: benchmark ? Math.round(((p.price - benchmark) / benchmark) * 100) : null,
      lastChecked,
      stale: lastChecked ? now - lastChecked.getTime() > STALE_DAYS * 24 * 60 * 60 * 1000 : false,
      insufficient: linked.length < MIN_COMPARABLES,
    };
  });
}

export async function saveCompetitorPrice(actor: AuditActor, input: CompetitorInput, id?: string) {
  const row = id
    ? await prisma.competitorPrice.update({ where: { id }, data: input })
    : await prisma.competitorPrice.create({ data: input });
  await audit(actor, id ? "market.update" : "market.create", "market", row.id, `${row.restaurant} · ${row.itemName}: ${formatPrice(row.price)}`);
  return row;
}

export async function deleteCompetitorPrice(actor: AuditActor, id: string) {
  const row = await prisma.competitorPrice.delete({ where: { id } });
  await audit(actor, "market.delete", "market", id, `${row.restaurant} · ${row.itemName}`);
}

export const CSV_COLUMNS = ["restaurant", "item", "category", "price_mdl", "size", "offer_type", "source_type", "source_url", "checked_at", "notes", "buniq_slug"] as const;

/**
 * Validates a CSV (header row with CSV_COLUMNS) and, only if every row is valid, imports it.
 * Rows identical to an existing record (restaurant, item, source URL, check date) are skipped.
 * Returns the line-numbered errors, or the counts.
 */
export async function importCompetitorCsv(actor: AuditActor, text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { errors: ["Fișierul nu are rânduri de date."], created: 0, skipped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.indexOf(c)]));
  const missing = CSV_COLUMNS.filter((c) => c !== "notes" && c !== "buniq_slug" && c !== "size" && index[c] < 0);
  if (missing.length) return { errors: [`Lipsesc coloanele: ${missing.join(", ")}`], created: 0, skipped: 0 };
  if (rows.length > 1001) return { errors: ["Maxim 1000 de rânduri per import."], created: 0, skipped: 0 };

  const slugs = await prisma.product.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(slugs.map((s) => [s.slug, s.id]));
  const errors: string[] = [];
  const valid: CompetitorInput[] = [];
  rows.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (c: (typeof CSV_COLUMNS)[number]) => (index[c] >= 0 ? (cells[index[c]] ?? "").trim() : "");
    const slug = get("buniq_slug");
    const productId = slug ? (bySlug.get(slug) ?? undefined) : null;
    if (productId === undefined) {
      errors.push(`Rândul ${line}: produsul BUNIQ „${slug}” nu există.`);
      return;
    }
    const date = /^\d{4}-\d{2}-\d{2}$/.test(get("checked_at")) ? new Date(`${get("checked_at")}T12:00:00Z`) : new Date(Number.NaN);
    const parsed = competitorInputSchema.safeParse({
      restaurant: get("restaurant"),
      itemName: get("item"),
      category: get("category"),
      price: parsePriceToBani(get("price_mdl")),
      size: get("size") || null,
      offerType: get("offer_type").toUpperCase(),
      sourceType: get("source_type").toUpperCase(),
      sourceUrl: get("source_url"),
      checkedAt: date,
      notes: get("notes") || null,
      productId,
    });
    if (!parsed.success) errors.push(`Rândul ${line}: ${parsed.error.issues.map((x) => x.message).join("; ")}`);
    else valid.push(parsed.data);
  });
  if (errors.length) return { errors: errors.slice(0, 50), created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;
  for (const row of valid) {
    const duplicate = await prisma.competitorPrice.count({
      where: { restaurant: row.restaurant, itemName: row.itemName, sourceUrl: row.sourceUrl, checkedAt: row.checkedAt },
    });
    if (duplicate) {
      skipped++;
      continue;
    }
    await prisma.competitorPrice.create({ data: row });
    created++;
  }
  await audit(actor, "market.import", "market", null, `Import CSV: ${created} adăugate, ${skipped} duplicate ignorate`);
  return { errors: [], created, skipped };
}

/**
 * Sets a BUNIQ price from the market page. The caller passes the price it showed as current:
 * if the product changed meanwhile, nothing is written (the administrator confirms again).
 */
export async function setProductPriceConfirmed(actor: AuditActor, productId: string, expectedOld: number, next: number) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, price: true, slug: true } });
  if (!product) return { error: "Produsul nu mai există." } as const;
  if (product.price !== expectedOld) return { error: `Prețul s-a schimbat între timp (acum ${formatPrice(product.price)}). Verifică din nou.` } as const;
  const { count } = await prisma.product.updateMany({ where: { id: productId, price: expectedOld }, data: { price: next } });
  if (count !== 1) return { error: "Prețul s-a schimbat între timp. Verifică din nou." } as const;
  await audit(actor, "product.price", "product", productId, `${product.name}: preț ${formatPrice(expectedOld)} → ${formatPrice(next)} (din Piață)`);
  return { slug: product.slug } as const;
}

export type { OfferType, PriceSourceType };
