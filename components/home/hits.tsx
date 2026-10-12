import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { ProductBadges } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { discountPercent } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

const STRETCHED_LINK =
  "after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline";

function quickAdd(p: ProductCardData) {
  return { id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, soldOut: p.soldOut };
}

/**
 * The house hits on the near-black stage: the first one as a wide feature card (photo, name,
 * description, price and "Add to cart"), the others as compact dark cards with a round "+",
 * and a tile leading to every popular item. Desktop: the feature on the left (photo on top),
 * the others two by two on the right, so every card stays wide enough to read. Tablets: the
 * feature across (photo beside the text), the rest in a row of four. Phones: the feature, then
 * the rest two by two.
 */
export async function Hits({ products }: { products: ProductCardData[] }) {
  const { t, href } = await getI18n();
  const [feature, ...rest] = products;
  if (!feature) return null;

  return (
    <section aria-labelledby="hits-title" className="bg-night text-on-dark">
      <div className="container-page section-y">
        <SectionHeading id="hits-title" tone="dark" eyebrow={t.hits.eyebrow} title={t.hits.title} lead={t.hits.lead} />
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
          <FeatureCard product={feature} />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-2 lg:gap-5">
            {rest.map((p) => (
              <li key={p.id} className="flex">
                <CompactCard product={p} />
              </li>
            ))}
            <li className="flex">
              <Link
                href={href("/menu?filter=popular")}
                className="group flex w-full flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-line-dark p-5 transition-colors hover:border-flame focus-visible:border-flame sm:p-6"
              >
                <span className="font-display text-lg leading-tight font-extrabold tracking-[-0.02em] sm:text-xl lg:text-2xl">{t.hits.viewAll}</span>
                <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-on-dark/40 transition-[translate,border-color,background-color] duration-[var(--duration-base)] group-hover:translate-x-1 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                  <ArrowRight className="size-5" aria-hidden />
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

async function FeatureCard({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  return (
    <article className="group relative grid overflow-hidden rounded-[var(--radius-panel)] border border-line-dark bg-graphite md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-cols-1 lg:grid-rows-[minmax(0,1fr)_auto]">
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[19rem] lg:min-h-[22rem]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1344px) 660px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-brand)] group-hover:scale-[1.04]"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          spicy={product.spicy}
          soldOut={product.soldOut}
          discount={discountPercent(product.price, product.oldPrice)}
          labels={{ isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest, spicy: t.product.badgeSpicy, soldOut: t.product.soldOut }}
          className="absolute top-4 left-4"
        />
      </div>
      <div className="flex flex-col p-5 sm:p-6">
        <h3 className="font-display text-[1.75rem] leading-none font-black tracking-[-0.035em] uppercase sm:text-[2rem]">
          <Link href={href(`/menu/${product.slug}`)} className={STRETCHED_LINK}>
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-on-dark">{product.shortDescription}</p>
        <div className="mt-auto pt-6">
          {product.weight ? (
            <p className="mb-0.5 text-sm text-muted-on-dark tabular-nums">
              {product.weight} {product.weightUnit}
            </p>
          ) : null}
          <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} size="lg" tone="dark" />
          {/* Above the card's stretched link; the wrapper sizes the full-width button to its label. */}
          <div className="relative z-10 mt-4 inline-flex">
            <QuickAddButton variant="full" product={quickAdd(product)} />
          </div>
        </div>
      </div>
    </article>
  );
}

async function CompactCard({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line-dark bg-graphite">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1344px) 320px, (min-width: 768px) 24vw, 48vw"
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <h3 className="font-display text-[0.9375rem] leading-snug font-bold tracking-[-0.01em] sm:text-[1.0625rem]">
          <Link href={href(`/menu/${product.slug}`)} className={STRETCHED_LINK}>
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 hidden text-[0.8125rem] leading-relaxed text-muted-on-dark sm:line-clamp-2">{product.shortDescription}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} size="md" tone="dark" className="flex-col gap-0" />
          <QuickAddButton variant="icon" tone="dark" className="relative z-10" product={quickAdd(product)} />
        </div>
      </div>
    </article>
  );
}
