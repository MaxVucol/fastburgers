"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { parsePriceToBani } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { translateAdminMessage } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";
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
  const { a } = await getAdminI18n();
  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: a.market.invalidRecord };
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
  if (!parsed.success) return { error: a.common.checkFields, errors: parsed.error.issues.map((i) => translateAdminMessage(a, i.message)) };
  await saveCompetitorPrice(admin, parsed.data, id || undefined);
  refresh();
  return { notice: id ? a.market.updated : a.market.added };
}

export async function deleteCompetitorAction(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (!isObjectId(id)) return { error: (await getAdminI18n()).a.market.invalidRecord };
  await deleteCompetitorPrice(admin, id);
  refresh();
  return {};
}

export async function importCompetitorCsvAction(_prev: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: a.market.chooseFile };
  if (file.size > 1_000_000) return { error: a.market.tooLarge };
  const result = await importCompetitorCsv(admin, await file.text());
  if (result.errors.length) return { error: a.market.importStopped, errors: result.errors.map((e) => translateAdminMessage(a, e)) };
  refresh();
  return { notice: fill(a.market.imported, { created: result.created, skipped: result.skipped }) };
}

/** Changes a BUNIQ price after the administrator confirmed "old → new" on the market page. */
export async function setPriceFromMarketAction(productId: string, expectedOld: number, nextInput: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  const next = parsePriceToBani(nextInput);
  if (!isObjectId(productId) || !Number.isInteger(expectedOld) || !Number.isFinite(next) || next < 100 || next > 1_000_000) {
    return { error: a.market.invalidPrice };
  }
  if (next === expectedOld) return { error: a.market.samePrice };
  const result = await setProductPriceConfirmed(admin, productId, expectedOld, next);
  if ("error" in result) return { error: translateAdminMessage(a, result.error ?? "") };
  updateTag(CATALOG_TAGS.products);
  updateTag(CATALOG_TAGS.product(result.slug));
  refresh();
  return {};
}
