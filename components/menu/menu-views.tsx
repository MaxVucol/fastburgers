import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductGrid } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import type { CategorySummary, ProductCardData } from "@/types/catalog";

/** The full menu, grouped by category, with anchors (/menu#burgeri). */
export function GroupedMenu({
  categories,
  products,
}: {
  categories: CategorySummary[];
  products: ProductCardData[];
}) {
  const groups = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-14 sm:space-y-16">
      {groups.map(({ category, items }, index) => (
        <section key={category.id} id={category.slug} aria-labelledby={`cat-${category.slug}`} className="scroll-mt-28">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 id={`cat-${category.slug}`} className="text-2xl font-extrabold sm:text-3xl">
                {category.name}
              </h2>
              {category.description && <p className="mt-1 text-sm text-muted">{category.description}</p>}
            </div>
            <Link href={`/categorii/${category.slug}`} className="text-sm font-semibold text-muted hover:text-accent">
              {items.length} produse
            </Link>
          </div>
          <ProductGrid products={items} eagerCount={index === 0 ? 4 : 0} />
        </section>
      ))}
    </div>
  );
}

export function FilteredMenu({ products, hasSearch }: { products: ProductCardData[]; hasSearch: boolean }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
        <SearchX className="size-10 text-muted" aria-hidden />
        <h2 className="mt-4 text-xl font-bold">Niciun produs găsit</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          {hasSearch
            ? "Încearcă un alt termen — de exemplu „burger”, „pui” sau „ciocolată”."
            : "Nu există produse pentru combinația de filtre aleasă."}
        </p>
        <ButtonLink href="/menu" variant="dark" className="mt-6">
          Vezi tot meniul
        </ButtonLink>
      </div>
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted" role="status">
        {products.length === 1 ? "1 produs găsit" : `${products.length} produse găsite`}
      </p>
      <ProductGrid products={products} eagerCount={4} />
    </>
  );
}
