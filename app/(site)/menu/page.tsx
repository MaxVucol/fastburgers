import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuToolbar } from "@/components/menu/menu-toolbar";
import { FilteredMenu, GroupedMenu } from "@/components/menu/menu-views";
import { DEFAULT_MENU_QUERY, filterProducts, isDefaultQuery, parseMenuQuery } from "@/lib/menu-query";
import { getCategories, getMenuProducts } from "@/services/catalog";
import type { CategorySummary, ProductCardData } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Meniu — burgeri, pizza, chicken, cartofi și deserturi",
  description:
    "Tot meniul Fast Burgers cu prețuri: smash burgers din vită Angus, pizza la cuptor, aripioare, wraps, combo-uri, deserturi și băuturi. Comandă online.",
  alternates: { canonical: "/menu" },
  openGraph: { title: "Meniul Fast Burgers", url: "/menu" },
};

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  // Cached reads: the full grouped menu is part of the static shell.
  const [categories, products] = await Promise.all([getCategories(), getMenuProducts()]);

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6 max-w-2xl sm:mb-8">
        <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent uppercase">Meniu</p>
        <h1 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">Ce mâncăm azi?</h1>
        <p className="mt-3 text-muted sm:text-lg">
          {products.length} produse gătite la comandă. Caută, filtrează sau adaugă direct în coș.
        </p>
      </header>

      <Suspense
        fallback={
          <MenuBody categories={categories}>
            <GroupedMenu categories={categories} products={products} />
          </MenuBody>
        }
      >
        <MenuResults searchParams={searchParams} categories={categories} products={products} />
      </Suspense>
    </div>
  );
}

function MenuBody({
  categories,
  query = DEFAULT_MENU_QUERY,
  children,
}: {
  categories: CategorySummary[];
  query?: typeof DEFAULT_MENU_QUERY;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="z-30 -mx-4 mb-8 sm:sticky sm:top-16 border-b border-line/70 bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:top-[4.5rem] lg:mx-0 lg:rounded-b-2xl lg:px-0">
        <MenuToolbar query={query} categories={categories} />
      </div>
      {children}
    </>
  );
}

async function MenuResults({
  searchParams,
  categories,
  products,
}: {
  searchParams: PageProps<"/menu">["searchParams"];
  categories: CategorySummary[];
  products: ProductCardData[];
}) {
  const query = parseMenuQuery(await searchParams);
  return (
    <MenuBody categories={categories} query={query}>
      {isDefaultQuery(query) ? (
        <GroupedMenu categories={categories} products={products} />
      ) : (
        <FilteredMenu products={filterProducts(products, query)} hasSearch={Boolean(query.q)} />
      )}
    </MenuBody>
  );
}
