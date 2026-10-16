"use server";

import { getProductBySlug } from "@/services/catalog";
import type { ProductOptionView } from "@/types/catalog";

/**
 * Extras and options of one dish, read when a catalog card's "+" is pressed (the cards themselves
 * carry only the number of options, so the menu pages stay light). Public catalog data only.
 */
export async function productOptionsAction(slug: string): Promise<ProductOptionView[]> {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(slug)) return [];
  const product = await getProductBySlug(slug);
  return product ? product.options.map((o) => ({ id: o.id, name: o.name, price: o.price })) : [];
}
