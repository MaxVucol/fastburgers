"use client";

import Image from "next/image";
import Link from "next/link";
import { CardActions, CardAdd } from "./card-actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ProductBadges, type BadgeLabels } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { discountPercent } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/catalog";

export const PRODUCT_GRID_SIZES =
  "(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 520px) 46vw, 100vw";

function badgeLabels(t: Dictionary): BadgeLabels {
  return { isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest, spicy: t.product.badgeSpicy, soldOut: t.product.soldOut };
}

/** Catalog card: white card on cream, photo-led, price and a round "+" at the bottom. */
export function ProductCard({
  product,
  eager = false,
  preload = false,
  headingLevel = "h3",
  className,
}: {
  product: ProductCardData;
  /** Load immediately — for cards visible in the first viewport. */
  eager?: boolean;
  /** Preload with high priority — only the first card of a page (its LCP image). */
  preload?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const { locale, t, href } = useI18n();
  const Heading = headingLevel;
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-transparent bg-cream transition-[border-color,box-shadow] duration-[450ms] ease-out motion-reduce:transition-none shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_22px_-8px_rgb(0_0_0/0.2)] hover:border-oat hover:shadow-[0_2px_4px_rgb(0_0_0/0.08),0_14px_28px_-10px_rgb(0_0_0/0.26)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={PRODUCT_GRID_SIZES}
          quality={70}
          {...(preload ? { preload: true } : { loading: eager ? "eager" : "lazy" })}
          className="object-cover"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          spicy={product.spicy}
          soldOut={product.soldOut}
          discount={null}
          labels={badgeLabels(t)}
          className="absolute top-3 left-3"
        />
        {/* The discount is a diagonal ribbon in the top-right corner. */}
        {discount ? (
          <span className="pointer-events-none absolute top-0 right-0 size-20 overflow-hidden">
            <span className="absolute top-[1.125rem] -right-[2.75rem] w-32 rotate-45 bg-[#8b1a1a] py-0.5 text-center font-display text-[0.8125rem] leading-4 font-extrabold tracking-[-0.01em] text-white">
              −{discount}%
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:px-[1.125rem]">
        <Heading className="font-display text-[1.0625rem] leading-snug font-bold tracking-[-0.015em] text-ink">
          <Link
            href={href(`/menu/${product.slug}`)}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </Heading>
        <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {product.weight ? (
              <p className="mb-0.5 text-xs text-muted tabular-nums">
                {product.weight} {product.weightUnit}
              </p>
            ) : null}
            <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} />
          </div>
          <div className="flex items-center gap-1">
            <CardActions product={product} />
            <CardAdd product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  children,
  columns = "auto",
  className,
}: {
  children: React.ReactNode;
  /** "four": four columns from `lg` (a single row of highlights); "auto": 3 on `lg`, 4 on `xl`. */
  columns?: "auto" | "four";
  className?: string;
}) {
  const wide = columns === "four" ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div
      // The menu lists every product: cards far below the screen are not laid out or painted until near it.
      className={cn("grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 [&>article]:[contain-intrinsic-size:auto_26rem] [&>article]:[content-visibility:auto]", wide, className)}
    >
      {children}
    </div>
  );
}

/** Convenience: a grid of catalog cards. */
export function ProductList({
  products,
  eagerCount = 0,
  columns,
  className,
}: {
  products: ProductCardData[];
  eagerCount?: number;
  columns?: "auto" | "four";
  className?: string;
}) {
  return (
    <ProductGrid columns={columns} className={className}>
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          eager={i < eagerCount}
          preload={i === 0 && eagerCount > 0}
        />
      ))}
    </ProductGrid>
  );
}
