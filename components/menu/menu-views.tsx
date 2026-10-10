import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { ProductList } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { CategorySummary, ProductCardData } from "@/types/catalog";

/** The full menu, grouped by category, with anchors (/menu#burgeri). */
export async function GroupedMenu({
  categories,
  products,
}: {
  categories: CategorySummary[];
  products: ProductCardData[];
}) {
  const { locale, t, href } = await getI18n();
  const groups = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-16 sm:space-y-20">
      {groups.map(({ category, items }, index) => (
        <section
          key={category.id}
          id={category.slug}
          aria-labelledby={`cat-${category.slug}`}
          className="scroll-mt-[calc(var(--header-h)+7.5rem)]"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-sm font-medium text-muted tabular-nums" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`cat-${category.slug}`} className="font-display text-[2rem] leading-none font-bold uppercase sm:text-[2.5rem]">
                  {category.name}
                </h2>
                {category.description && <p className="mt-2 text-sm text-muted sm:text-base">{category.description}</p>}
              </div>
            </div>
            <Link
              href={href(`/categorii/${category.slug}`)}
              className="group inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-accent-ink"
            >
              {plural(locale, items.length, t.categories.count)}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </Link>
          </div>
          <ProductList products={items} eagerCount={index === 0 ? 4 : 0} />
        </section>
      ))}
    </div>
  );
}

export async function FilteredMenu({ products, hasSearch }: { products: ProductCardData[]; hasSearch: boolean }) {
  const { locale, t, href } = await getI18n();
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-panel)] border-[1.5px] border-dashed border-oat px-6 py-20 text-center">
        <SearchX className="size-10 text-muted" aria-hidden strokeWidth={1.6} />
        <h2 className="mt-5 font-display text-3xl font-semibold uppercase">{t.menu.emptyTitle}</h2>
        <p className="mt-2 max-w-sm text-muted">{hasSearch ? t.menu.emptySearch : t.menu.emptyFilters}</p>
        <ButtonLink href={href("/menu")} variant="dark" className="mt-7">
          {t.menu.seeAll}
        </ButtonLink>
      </div>
    );
  }
  return (
    <>
      <p className="mb-5 text-sm font-semibold text-muted" role="status">
        {plural(locale, products.length, t.menu.found)}
      </p>
      <ProductList products={products} eagerCount={4} />
    </>
  );
}
