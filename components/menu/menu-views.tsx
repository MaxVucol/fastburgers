"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ProductList } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import categoryIcons from "@/lib/category-icons.json";
import { plural } from "@/lib/i18n/config";
import type { CategorySummary, ProductCardData } from "@/types/catalog";

const icons: Record<string, { src: string; width: number }> = categoryIcons;

/** The full menu, grouped by category, with anchors (/menu#burgeri). Rendered on the server for the first paint, then lives in the browser. */
export function GroupedMenu({
  categories,
  products,
}: {
  categories: CategorySummary[];
  products: ProductCardData[];
}) {
  const { locale, t, href } = useI18n();
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
            <div className="flex items-center gap-4 sm:gap-5">
              {/* The category's picture (the number, where a category has none yet). */}
              {icons[category.slug] ? (
                <Image
                  src={icons[category.slug].src}
                  alt=""
                  width={icons[category.slug].width}
                  height={144}
                  sizes="96px"
                  className="h-14 w-auto shrink-0 object-contain sm:h-16"
                />
              ) : (
                <span className="font-display text-sm font-medium text-muted tabular-nums" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
              <div>
                <h2 id={`cat-${category.slug}`} className="font-display text-[1.75rem] leading-tight font-extrabold tracking-[-0.03em] sm:text-[2.25rem]">
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

export function FilteredMenu({ products, hasSearch }: { products: ProductCardData[]; hasSearch: boolean }) {
  const { locale, t, href } = useI18n();
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-panel)] border-[1.5px] border-dashed border-oat px-6 py-20 text-center">
        <SearchX className="size-10 text-muted" aria-hidden strokeWidth={1.6} />
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.02em]">{t.menu.emptyTitle}</h2>
        <p className="mt-2 max-w-sm text-muted">{hasSearch ? t.menu.emptySearch : t.menu.emptyFilters}</p>
        <ButtonLink href={href("/menu")} variant="dark" className="mt-7">
          {t.menu.seeAll}
        </ButtonLink>
      </div>
    );
  }
  return (
    <>
      <h2 className="sr-only">{t.menu.eyebrow}</h2>
      <p className="mb-5 text-sm font-semibold text-muted" role="status">
        {plural(locale, products.length, t.menu.found)}
      </p>
      <ProductList products={products} eagerCount={4} />
    </>
  );
}
