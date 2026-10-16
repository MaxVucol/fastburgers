import type { CategorySummary, PickupLocation, ProductCardData, ProductDetail } from "@/types/catalog";
import { siteConfig } from "@/lib/site";
import { catalogCopy } from "./catalog-translations";
import type { Locale } from "./config";

// Translates database rows (Romanian) for display. Pure functions, safe in cached code.

export function localizeCategory<T extends Pick<CategorySummary, "slug" | "name" | "description">>(
  category: T,
  locale: Locale,
): T {
  if (locale === "ro") return category;
  const copy = catalogCopy[locale].categories[category.slug];
  return copy ? { ...category, name: copy.name, description: copy.description } : category;
}

/** Imported menu texts carry raw line breaks ("<br>"); show them as a separator. */
const tidy = (text: string) => text.replace(/\s*<br\s*\/?>\s*/gi, " · ");

export function localizeCard<T extends ProductCardData>(product: T, locale: Locale): T {
  if (locale === "ro") {
    return { ...product, shortDescription: tidy(product.shortDescription), description: tidy(product.description) };
  }
  const copy = catalogCopy[locale].products[product.slug];
  const category = catalogCopy[locale].categories[product.categorySlug];
  return {
    ...product,
    name: copy?.name || product.name,
    shortDescription: tidy(copy?.short ?? product.shortDescription),
    description: tidy(copy?.description ?? product.description),
    categoryName: category?.name ?? product.categoryName,
  };
}

export function localizeProduct(product: ProductDetail, locale: Locale): ProductDetail {
  if (locale === "ro") return localizeCard(product, locale);
  const copy = catalogCopy[locale];
  const translated = copy.products[product.slug];
  return {
    ...localizeCard(product, locale),
    // Ingredient lists are product-specific; only use the translation while it still
    // matches the stored list (an admin edit in Romanian makes it fall back).
    ingredients:
      translated && translated.ingredients.length === product.ingredients.length
        ? translated.ingredients
        : product.ingredients,
    allergens: product.allergens.map((a) => copy.allergens[a] ?? a),
  };
}

/**
 * Restaurant names are stored with the previous brand ("Fast Burgers Centru"). The
 * database is left untouched; the current brand name is applied when displaying them.
 */
const LEGACY_BRAND = /^Fast Burgers\b/;

export function localizeLocation(location: PickupLocation, locale: Locale): PickupLocation {
  const name = location.name.replace(LEGACY_BRAND, siteConfig.name);
  if (locale === "ro") return { ...location, name };
  let hours = location.hours;
  for (const [from, to] of Object.entries(catalogCopy[locale].hoursWords)) {
    hours = hours.replace(from, to);
  }
  return { ...location, name, hours };
}

/** Option names are stored in Romanian (database, cart, order snapshots). */
export function optionName(name: string, options: Record<string, string>): string {
  return options[name] ?? name;
}
