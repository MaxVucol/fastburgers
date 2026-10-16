"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ProductList } from "@/components/product/product-card";
import { DEFAULT_MENU_QUERY, filterProducts, isDefaultQuery, MENU_FILTERS, menuQueryToSearch, parseMenuQuery, type MenuFilter, type MenuQuery } from "@/lib/menu-query";
import type { CategorySummary, ProductCardData } from "@/types/catalog";
import { FilteredMenu, GroupedMenu } from "./menu-views";
import { MenuToolbarBar } from "./menu-toolbar";

const sameQuery = (a: MenuQuery, b: MenuQuery) => menuQueryToSearch(a) === menuQueryToSearch(b);

/** Reads the address bar (the header search, shared links) and reports it as a query. */
function UrlSync({ onUrl }: { onUrl: (query: MenuQuery) => void }) {
  const params = useSearchParams();
  const key = params.toString();
  useEffect(() => {
    onUrl(parseMenuQuery(Object.fromEntries(new URLSearchParams(key))));
  }, [key, onUrl]);
  return null;
}

/**
 * The menu (or one category of it) with its search, filters and sorting.
 *
 * The server renders every product once (the whole page is static); from there the browser does all
 * the work: a press on a filter, a sort or a key in the search box is answered from the list already
 * in memory, with no request. The address bar is kept up to date (history.replaceState) so a
 * filtered view can still be shared, and the first paint is the unfiltered list.
 */
export function MenuExplorer({
  products,
  categories,
  categorySlug,
  path,
}: {
  products: ProductCardData[];
  categories: CategorySummary[];
  /** Set on a category page: only that category is listed and shown without grouping. */
  categorySlug?: string;
  /** The page's own address, to which the chosen filters are appended. */
  path: string;
}) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState<MenuQuery>(DEFAULT_MENU_QUERY);
  const latest = useRef(query);
  // The dim-in only plays for a change made on the page, not for the first paint.
  const [touched, setTouched] = useState(false);
  const items = useMemo(() => (categorySlug ? products.filter((p) => p.categorySlug === categorySlug) : products), [products, categorySlug]);
  // Only the filters that have something to show here: a category without a popular, new or
  // discounted product does not offer that filter (and a link to it falls back to "all").
  const filters = useMemo<MenuFilter[]>(
    () =>
      MENU_FILTERS.filter(
        (f) =>
          f === "all" ||
          items.some((p) => (f === "popular" ? p.popular : f === "new" ? p.isNew : p.oldPrice !== null && p.oldPrice > p.price)),
      ),
    [items],
  );
  const view = filters.includes(query.filter) ? query : { ...query, filter: "all" as const };
  const deferred = useDeferredValue(view);

  const apply = useCallback(
    (next: Partial<MenuQuery>) => {
      const merged = { ...latest.current, ...next, category: categorySlug ? "" : (next.category ?? latest.current.category) };
      latest.current = merged;
      setTouched(true);
      setQuery(merged);
      window.history.replaceState(null, "", `${path}${menuQueryToSearch(merged)}`);
    },
    [categorySlug, path],
  );

  const fromUrl = useCallback(
    (parsed: MenuQuery) => {
      const next = categorySlug ? { ...parsed, category: "" } : parsed;
      if (sameQuery(next, latest.current)) return;
      latest.current = next;
      setQuery(next);
    },
    [categorySlug],
  );

  const filtered = useMemo(
    () => (isDefaultQuery(deferred) ? null : filterProducts(items, deferred, locale)),
    [items, deferred, locale],
  );
  // A new filter or sorting brings the result in out of a short dim; typing does not (it would flicker on every key).
  const animationKey = `${deferred.filter}|${deferred.sort}|${deferred.category}|${filtered === null}`;
  const spacing = categorySlug ? "pt-8 pb-20 sm:pt-10 sm:pb-28" : "pt-10 pb-20 sm:pt-12 sm:pb-28";

  return (
    <>
      <Suspense fallback={null}>
        <UrlSync onUrl={fromUrl} />
      </Suspense>
      <MenuToolbarBar query={view} filters={filters} onChange={apply} />
      <div key={animationKey} className={`container-page ${touched ? "results-in" : ""} ${spacing}`}>
        {filtered ? (
          <FilteredMenu products={filtered} hasSearch={Boolean(deferred.q)} />
        ) : categorySlug ? (
          <>
            <h2 className="sr-only">{t.menu.eyebrow}</h2>
            <ProductList products={items} eagerCount={4} />
          </>
        ) : (
          <GroupedMenu categories={categories} products={items} />
        )}
      </div>
    </>
  );
}
