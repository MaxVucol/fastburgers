import "server-only";
import { localizeCard, localizeCategory, localizeLocation, localizeProduct } from "@/lib/i18n/catalog";
import type { Locale } from "@/lib/i18n/config";
import type { ProductCardData } from "@/types/catalog";
import {
  getCategories,
  getCategoryBySlug,
  getMenuProducts,
  getPickupLocations,
  getProductBySlug,
  getRelatedProducts,
} from "./catalog";

// Cached catalog reads (services/catalog.ts) + translation for display.
// Translation is a cheap in-memory map, so the cache stays language-independent.

export async function getMenu(locale: Locale) {
  const [categories, products] = await Promise.all([getCategories(), getMenuProducts()]);
  return {
    categories: categories.map((c) => localizeCategory(c, locale)),
    products: products.map((p) => localizeCard(p, locale)),
  };
}

export async function getLocalizedCategory(slug: string, locale: Locale) {
  const category = await getCategoryBySlug(slug);
  return category ? localizeCategory(category, locale) : null;
}

export async function getLocalizedProduct(slug: string, locale: Locale) {
  const product = await getProductBySlug(slug);
  return product ? localizeProduct(product, locale) : null;
}

export async function getLocalizedRelated(product: ProductCardData, locale: Locale) {
  const related = await getRelatedProducts(product);
  return related.map((p) => localizeCard(p, locale));
}

export async function getLocalizedLocations(locale: Locale) {
  const locations = await getPickupLocations();
  return locations.map((l) => localizeLocation(l, locale));
}
