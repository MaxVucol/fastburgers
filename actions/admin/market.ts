"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { parsePriceToBani } from "@/lib/format";
import { isObjectId } from "@/lib/utils";
import { CATALOG_TAGS } from "@/services/catalog";
import {
  competitorInputSchema,
  deleteCompetitorPrice,
  importCompetitorCsv,
  saveCompetitorPrice,
  setProductPriceConfirmed,
} from "@/services/market";

export type MarketFormState = { error?: string; notice?: string; errors?: string[] };

export async function saveCompetitorAction(_prev: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: "Înregistrare invalidă." };
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const day = text("checkedAt");
  const productId = text("productId");
  const parsed = competitorInputSchema.safeParse({
    restaurant: text("restaurant"),
    itemName: text("itemName"),
    category: text("category"),
    price: parsePriceToBani(text("price")),
    size: text("size") || null,
    offerType: text("offerType"),
    sourceType: text("sourceType"),
    sourceUrl: text("sourceUrl"),
    checkedAt: /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`) : new Date(Number.NaN),
    notes: text("notes") || null,
    productId: productId || null,
  });
  if (!parsed.success) return { error: "Verifică câmpurile.", errors: parsed.error.issues.map((i) => i.message) };
  await saveCompetitorPrice(admin, parsed.data, id || undefined);
  refresh();
  return { notice: id ? "Înregistrarea a fost actualizată." : "Prețul concurentului a fost adăugat." };
}

export async function deleteCompetitorAction(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (!isObjectId(id)) return { error: "Înregistrare invalidă." };
  await deleteCompetitorPrice(admin, id);
  refresh();
  return {};
}

export async function importCompetitorCsvAction(_prev: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Alege un fișier CSV." };
  if (file.size > 1_000_000) return { error: "Fișierul depășește 1 MB." };
  const result = await importCompetitorCsv(admin, await file.text());
  if (result.errors.length) return { error: "Importul a fost oprit: nicio înregistrare nu a fost salvată.", errors: result.errors };
  refresh();
  return { notice: `Import reușit: ${result.created} înregistrări noi, ${result.skipped} duplicate ignorate.` };
}

/** Changes a BUNIQ price after the administrator confirmed "old → new" on the market page. */
export async function setPriceFromMarketAction(productId: string, expectedOld: number, nextInput: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const next = parsePriceToBani(nextInput);
  if (!isObjectId(productId) || !Number.isInteger(expectedOld) || !Number.isFinite(next) || next < 100 || next > 1_000_000) {
    return { error: "Preț invalid." };
  }
  if (next === expectedOld) return { error: "Noul preț este identic cu cel actual." };
  const result = await setProductPriceConfirmed(admin, productId, expectedOld, next);
  if ("error" in result) return { error: result.error };
  updateTag(CATALOG_TAGS.products);
  updateTag(CATALOG_TAGS.product(result.slug));
  refresh();
  return {};
}
