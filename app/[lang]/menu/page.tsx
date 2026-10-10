import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuToolbar } from "@/components/menu/menu-toolbar";
import { FilteredMenu, GroupedMenu } from "@/components/menu/menu-views";
import { Spark } from "@/components/ui/brand";
import { plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { DEFAULT_MENU_QUERY, filterProducts, isDefaultQuery, parseMenuQuery } from "@/lib/menu-query";
import { getMenu } from "@/services/localized-catalog";
import type { CategorySummary, ProductCardData } from "@/types/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.meta.menuTitle,
    description: t.meta.menuDescription,
    alternates: localeAlternates(locale, "/menu"),
    openGraph: { title: t.meta.menuTitle },
  };
}

export default async function MenuPage({ searchParams }: PageProps<"/[lang]/menu">) {
  const { locale, t } = await getI18n();
  // Cached reads: the full grouped menu is part of the static shell.
  const { categories, products } = await getMenu(locale);

  return (
    <>
      <header className="container-page pt-10 pb-8 sm:pt-14 sm:pb-10">
        <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
          <Spark className="size-3.5 text-accent" />
          {t.menu.eyebrow}
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-end">
          <h1 className="type-h1">{t.menu.title}</h1>
          <p className="text-muted sm:text-lg lg:pb-2">{plural(locale, products.length, t.menu.lead)}</p>
        </div>
      </header>

      {/* The grouped menu is static (part of the prerendered shell, rendered once). Only the
          toolbar and filtered results depend on the URL query; when a filtered result is
          present, CSS hides the grouped menu (.menu-root:has(.menu-filtered) in globals.css). */}
      <div className="menu-root">
        <Suspense fallback={<MenuToolbarBar categories={categories} />}>
          <MenuResults searchParams={searchParams} categories={categories} products={products} />
        </Suspense>
        <div className="menu-grouped container-page pt-10 pb-20 sm:pt-12 sm:pb-28">
          <GroupedMenu categories={categories} products={products} />
        </div>
      </div>
    </>
  );
}

function MenuToolbarBar({
  categories,
  query = DEFAULT_MENU_QUERY,
}: {
  categories: CategorySummary[];
  query?: typeof DEFAULT_MENU_QUERY;
}) {
  return (
    <div className="z-30 border-b border-line bg-cream/95 backdrop-blur-md sm:sticky sm:top-[var(--header-h)]">
      <div className="container-page">
        <MenuToolbar query={query} categories={categories} />
      </div>
    </div>
  );
}

async function MenuResults({
  searchParams,
  categories,
  products,
}: {
  searchParams: PageProps<"/[lang]/menu">["searchParams"];
  categories: CategorySummary[];
  products: ProductCardData[];
}) {
  const [{ locale }, params] = await Promise.all([getI18n(), searchParams]);
  const query = parseMenuQuery(params);
  return (
    <>
      <MenuToolbarBar categories={categories} query={query} />
      {!isDefaultQuery(query) && (
        <div className="menu-filtered container-page pt-10 pb-20 sm:pt-12 sm:pb-28">
          <FilteredMenu products={filterProducts(products, query, locale)} hasSearch={Boolean(query.q)} />
        </div>
      )}
    </>
  );
}
