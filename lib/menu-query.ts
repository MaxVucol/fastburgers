import { intlLocale, type Locale } from "@/lib/i18n/config";
import { normalizeText } from "@/lib/utils";
import type { ProductCardData } from "@/types/catalog";

export type MenuSort = "recommended" | "price-asc" | "price-desc" | "name" | "newest";
export type MenuFilter = "all" | "popular" | "new" | "sale";

export type MenuQuery = {
  q: string;
  category: string;
  filter: MenuFilter;
  sort: MenuSort;
};

// Labels live in the dictionaries (t.menu.sorts / t.menu.filters).
export const MENU_SORTS: readonly MenuSort[] = ["recommended", "price-asc", "price-desc", "name", "newest"];
export const MENU_FILTERS: readonly MenuFilter[] = ["all", "popular", "new", "sale"];

export const DEFAULT_MENU_QUERY: MenuQuery = { q: "", category: "", filter: "all", sort: "recommended" };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function isSort(value: string): value is MenuSort {
  return (MENU_SORTS as readonly string[]).includes(value);
}

function isFilter(value: string): value is MenuFilter {
  return (MENU_FILTERS as readonly string[]).includes(value);
}

/** Parses untrusted search params into a known-good query. */
export function parseMenuQuery(params: Record<string, string | string[] | undefined>): MenuQuery {
  const filter = first(params.filter);
  const sort = first(params.sort);
  const category = first(params.category);
  return {
    q: first(params.q).slice(0, 80),
    category: /^[a-z0-9-]{1,80}$/.test(category) ? category : "",
    filter: isFilter(filter) ? filter : "all",
    sort: isSort(sort) ? sort : "recommended",
  };
}

export function isDefaultQuery(query: MenuQuery): boolean {
  return !query.q && !query.category && query.filter === "all" && query.sort === "recommended";
}

export function menuQueryToSearch(query: MenuQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.filter !== "all") params.set("filter", query.filter);
  if (query.sort !== "recommended") params.set("sort", query.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Searches name, descriptions and category name (diacritics-insensitive) in the
 * language being displayed. The menu is small enough that filtering the cached list
 * in memory beats a DB round-trip.
 */
export function filterProducts(products: ProductCardData[], query: MenuQuery, locale: Locale = "ro"): ProductCardData[] {
  const terms = normalizeText(query.q).split(/\s+/).filter(Boolean);

  const result = products.filter((p) => {
    if (query.category && p.categorySlug !== query.category) return false;
    if (query.filter === "popular" && !p.popular) return false;
    if (query.filter === "new" && !p.isNew) return false;
    if (query.filter === "sale" && !(p.oldPrice && p.oldPrice > p.price)) return false;
    if (terms.length === 0) return true;
    const haystack = normalizeText(`${p.name} ${p.shortDescription} ${p.description} ${p.categoryName}`);
    return terms.every((t) => haystack.includes(t));
  });

  switch (query.sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "name":
      return result.sort((a, b) => a.name.localeCompare(b.name, intlLocale[locale]));
    case "newest":
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    default:
      return result;
  }
}
