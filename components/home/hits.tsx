import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { ProductCard } from "@/components/product/product-card";
import { ProductBadges } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { discountPercent } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

/**
 * The house hits as a photo-led spread: the first one as a large feature card (photo first,
 * name set big, full description, price and an "Add" button), the others as regular cards and
 * a dark tile leading to every popular item. Desktop: feature 2×2 in a four-column grid.
 * Tablets: feature across, the rest two by two. Phones: feature, then the rest as a swipe rail.
 */
export async function Hits({ products }: { products: ProductCardData[] }) {
  const { t, href } = await getI18n();
  const [feature, ...rest] = products;
  if (!feature) return null;

  return (
    <section aria-labelledby="hits-title" className="container-page pb-[var(--section-y)]">
      <SectionHeading id="hits-title" eyebrow={t.hits.eyebrow} title={t.hits.title} lead={t.hits.lead} note={t.hits.note} />
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard product={feature} />
        <ul className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-2 md:contents [&>li]:w-[min(78vw,18.5rem)] [&>li]:shrink-0 [&>li]:snap-start md:[&>li]:w-auto">
          {rest.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} className="w-full" />
            </li>
          ))}
          <li className="flex">
            <Link
              href={href("/menu?filter=popular")}
              className="group flex w-full flex-col justify-between gap-10 rounded-[var(--radius-card)] bg-ink p-6 text-on-dark transition-colors hover:bg-graphite-soft"
            >
              <span className="font-display text-[1.625rem] leading-[1.05] font-extrabold tracking-[-0.03em] [overflow-wrap:anywhere] hyphens-auto sm:text-3xl lg:text-2xl xl:text-3xl">
                {t.hits.viewAll}
              </span>
              <span className="grid size-12 place-items-center self-end rounded-full bg-accent text-ink transition-transform duration-[var(--duration-base)] group-hover:translate-x-1">
                <ArrowRight className="size-5" aria-hidden />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

async function FeatureCard({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line bg-paper md:col-span-2 lg:row-span-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand md:aspect-[16/9] lg:aspect-auto lg:min-h-[22rem] lg:flex-1">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1344px) 660px, (min-width: 1024px) 50vw, (min-width: 768px) 92vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-brand)] group-hover:scale-[1.03]"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          discount={discountPercent(product.price, product.oldPrice)}
          labels={{ isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest }}
          className="absolute top-4 left-4"
        />
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-end md:justify-between lg:flex-col lg:items-stretch">
        <div className="max-w-md">
          <h3 className="font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.035em] sm:text-4xl">
            <Link
              href={href(`/menu/${product.slug}`)}
              className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-3 leading-relaxed text-muted">{product.shortDescription}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3 md:shrink-0 md:justify-end lg:justify-between">
          <div>
            {product.weight ? (
              <p className="mb-0.5 text-sm text-muted tabular-nums">
                {product.weight} {product.weightUnit}
              </p>
            ) : null}
            <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} size="lg" />
          </div>
          {/* Above the card's stretched link; the wrapper sizes the full-width button to its label. */}
          <div className="relative z-10 shrink-0">
            <QuickAddButton
              variant="full"
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
