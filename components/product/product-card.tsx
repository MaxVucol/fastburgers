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

function badgeLabels(t: Dictionary): BadgeLabels {
  return { isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest };
}

function quickAddProduct(product: ProductCardData) {
  return { id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price };
}

/** Catalog card: light, quiet, photo-led. */
export async function ProductCard({
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
  const { locale, t, href } = await getI18n();
  const Heading = headingLevel;
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-ivory",
        "transition-[border-color,transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-brand)]",
        "hover:-translate-y-1 hover:border-ink/25 hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={PRODUCT_GRID_SIZES}
          {...(preload ? { preload: true } : { loading: eager ? "eager" : "lazy" })}
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.04]"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          discount={discount}
          labels={badgeLabels(t)}
          className="absolute top-3 left-3"
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
        <p className="type-eyebrow text-[0.6875rem] text-muted">
          {product.categoryName}
          {product.weight ? (
            <span className="tracking-normal normal-case">
              {" "}
              · {product.weight} {product.weightUnit}
            </span>
          ) : null}
        </p>
        <Heading className="mt-1.5 font-display text-[1.375rem] leading-tight font-semibold text-ink">
          <Link
            href={href(`/menu/${product.slug}`)}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </Heading>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} />
          <QuickAddButton className="relative z-10" product={quickAddProduct(product)} />
        </div>
      </div>
    </article>
  );
}

/** Feature card for "house favourites": graphite, horizontal, photo bleeding to the edge. */
export async function FeatureCard({ product, eager = false }: { product: ProductCardData; eager?: boolean }) {
  const { locale, t, href } = await getI18n();
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <article className="group relative grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-card)] bg-graphite text-on-dark sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative min-h-[11.5rem] overflow-hidden bg-ink sm:min-h-[15rem]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 22vw, 45vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.05]"
        />
        {discount ? (
          <ProductBadges
            popular={false}
            isNew={false}
            discount={discount}
            labels={badgeLabels(t)}
            className="absolute top-3 left-3"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
        <h3 className="font-display text-[1.375rem] leading-[1.05] font-semibold sm:text-[1.625rem]">
          <Link
            href={href(`/menu/${product.slug}`)}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-on-dark sm:line-clamp-3 sm:text-sm">
          {product.shortDescription}
        </p>
        <div className="mt-auto pt-4">
          <Price
            price={product.price}
            oldPrice={product.oldPrice}
            locale={locale}
            oldPriceLabel={t.product.oldPrice}
            tone="dark"
            size="md"
          />
          <QuickAddButton tone="dark" className="relative z-10 mt-3 w-full justify-between sm:w-auto sm:justify-center" product={quickAddProduct(product)} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  children,
  layout = "grid",
  className,
}: {
  children: React.ReactNode;
  /** "rail": horizontal swipe list on phones (keeps sections short), grid from `sm` up. */
  layout?: "grid" | "rail";
  className?: string;
}) {
  return (
    <div
      className={cn(
        layout === "rail"
          ? "no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-[min(80vw,19rem)] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto"
          : "grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
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
  className,
}: {
  products: ProductCardData[];
  eagerCount?: number;
  layout?: "grid" | "rail";
  className?: string;
}) {
  return (
    <ProductGrid layout={layout} className={className}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} eager={i < eagerCount} preload={i === 0 && eagerCount > 0} />
      ))}
    </ProductGrid>
  );
}
