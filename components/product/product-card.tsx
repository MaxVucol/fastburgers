import Image from "next/image";
import Link from "next/link";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { ProductBadges, type BadgeLabels } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { discountPercent } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/catalog";

export const PRODUCT_GRID_SIZES =
  "(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 520px) 46vw, 100vw";
/** Row cards (home highlights): the photo takes ~44% of a card that is half the container wide on `md`+. */
const PRODUCT_ROW_SIZES = "(min-width: 1280px) 280px, (min-width: 768px) 22vw, 44vw";

function badgeLabels(t: Dictionary): BadgeLabels {
  return { isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest };
}

function quickAddProduct(product: ProductCardData) {
  return { id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price };
}

/**
 * Catalog card: white card on cream, photo-led, price and a round "+" at the bottom.
 * `layout="row"`: the same card laid sideways (photo left) for the home highlights — a bigger
 * photo per item while every card keeps the same height and the "+" stays in reach.
 */
export async function ProductCard({
  product,
  eager = false,
  preload = false,
  headingLevel = "h3",
  layout = "column",
  className,
}: {
  product: ProductCardData;
  layout?: "column" | "row";
  /** Load immediately — for cards visible in the first viewport. */
  eager?: boolean;
  /** Preload with high priority — only the first card of a page (its LCP image). */
  preload?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const { locale, t, href } = await getI18n();
  const Heading = headingLevel;
  const discount = discountPercent(product.price, product.oldPrice);
  const row = layout === "row";

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper",
        row ? "min-h-40 flex-row sm:min-h-48" : "flex-col",
        "transition-[border-color,transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-brand)]",
        "hover:-translate-y-1 hover:border-oat hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-sand", row ? "w-[44%] shrink-0" : "aspect-[4/3]")}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={row ? PRODUCT_ROW_SIZES : PRODUCT_GRID_SIZES}
          {...(preload ? { preload: true } : { loading: eager ? "eager" : "lazy" })}
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.05]"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          discount={discount}
          labels={badgeLabels(t)}
          className={cn("absolute left-3", row ? "top-3 max-w-[calc(100%-1.5rem)] flex-wrap" : "top-3")}
        />
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", row ? "p-4 sm:p-5" : "p-4 sm:px-[1.125rem]")}>
        <Heading
          className={cn(
            "font-display leading-snug font-bold tracking-[-0.015em] text-ink",
            row ? "text-[1.0625rem] sm:text-xl" : "text-[1.0625rem]",
          )}
        >
          <Link
            href={href(`/menu/${product.slug}`)}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </Heading>
        <p
          className={cn(
            "mt-1 text-[0.8125rem] leading-relaxed text-muted",
            row ? "line-clamp-2 sm:line-clamp-3 sm:text-sm" : "line-clamp-2",
          )}
        >
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {product.weight ? (
              <p className="mb-0.5 text-xs text-muted tabular-nums">
                {product.weight} {product.weightUnit}
              </p>
            ) : null}
            <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} />
          </div>
          <QuickAddButton variant="icon" className="relative z-10" product={quickAddProduct(product)} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  children,
  layout = "grid",
  columns = "auto",
  className,
}: {
  children: React.ReactNode;
  /**
   * "rail": horizontal swipe list on phones (keeps sections short), grid from `sm` up.
   * "rows": sideways cards, one per line on phones, two per line from `md`.
   */
  layout?: "grid" | "rail" | "rows";
  /** "four": four columns from `lg` (a single row of highlights); "auto": 3 on `lg`, 4 on `xl`. */
  columns?: "auto" | "four";
  className?: string;
}) {
  const wide = columns === "four" ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4";
  if (layout === "rows") return <div className={cn("grid gap-4 md:grid-cols-2 md:gap-5", className)}>{children}</div>;
  return (
    <div
      className={cn(
        layout === "rail"
          ? "no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:w-[min(78vw,18.5rem)] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto"
          : "grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5",
        wide,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Convenience: a grid of catalog cards. */
export function ProductList({
  products,
  eagerCount = 0,
  layout = "grid",
  columns,
  className,
}: {
  products: ProductCardData[];
  eagerCount?: number;
  layout?: "grid" | "rail" | "rows";
  columns?: "auto" | "four";
  className?: string;
}) {
  return (
    <ProductGrid layout={layout} columns={columns} className={className}>
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          layout={layout === "rows" ? "row" : "column"}
          eager={i < eagerCount}
          preload={i === 0 && eagerCount > 0}
        />
      ))}
    </ProductGrid>
  );
}
