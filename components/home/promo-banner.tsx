import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { Crown } from "@/components/ui/brand";
import { discountPercent, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

/**
 * Combo promo: a rounded graphite panel — copy and real price on the left, the photo on the
 * right fading into the panel. Discount and savings come from the product's own prices.
 */
export async function PromoBanner({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <section aria-labelledby="promo-title" className="container-page pb-[var(--section-y)]">
      <div className="relative grid overflow-hidden rounded-[var(--radius-panel)] bg-graphite text-on-dark lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── Photo (second on phones, right on desktop) ── */}
        <div className="relative order-first aspect-[4/3] sm:aspect-[16/10] lg:order-last lg:aspect-auto lg:min-h-[30rem]">
          <Image
            src="/images/promo/promo.webp"
            alt={t.promo.imageAlt}
            fill
            sizes="(min-width: 1344px) 690px, (min-width: 1024px) 52vw, 100vw"
            className="object-cover"
          />
          {/* Blend the photo into the panel on the side that meets the copy. */}
          <span
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite to-transparent lg:inset-y-0 lg:right-auto lg:left-0 lg:h-auto lg:w-1/3 lg:bg-gradient-to-r"
            aria-hidden
          />
          <Crown className="absolute top-[10%] left-[8%] h-10 -rotate-12 text-accent sm:h-12 lg:left-[14%]" strokeWidth={3} />
          <Crown className="absolute top-[22%] right-[7%] h-7 rotate-[18deg] text-accent/80 sm:h-8" strokeWidth={3.4} />
          {discount && (
            <p className="absolute right-5 bottom-5 grid size-24 rotate-[8deg] place-items-center rounded-full bg-accent text-center text-ink shadow-[var(--shadow-lift)] sm:size-28 lg:right-8 lg:bottom-8">
              <span>
                <span className="block font-display text-3xl leading-none font-extrabold tracking-[-0.03em] sm:text-[2rem]">
                  −{discount}%
                </span>
                <span className="mt-1 block text-[0.6875rem] font-semibold">{t.promo.badge}</span>
              </span>
            </p>
          )}
        </div>

        {/* ── Copy ── */}
        <div className="relative flex flex-col justify-center px-6 pt-2 pb-10 sm:px-10 sm:pb-12 lg:px-14 lg:py-14">
          <p className="type-eyebrow flex items-center gap-2 text-flame">
            <Crown className="h-3.5" />
            {t.promo.eyebrow}
          </p>
          <h2 id="promo-title" className="type-h1 mt-4 max-w-lg text-on-dark">
            {t.promo.title}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-on-dark">
            <span className="font-semibold text-on-dark">{product.name}.</span> {product.shortDescription}
          </p>

          <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="font-display text-[2.75rem] leading-none font-extrabold tracking-[-0.03em] text-flame tabular-nums">
              {formatPrice(product.price, locale)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="pb-1 text-sm text-muted-on-dark">
                <span className="line-through tabular-nums">
                  <span className="sr-only">{t.product.oldPrice} </span>
                  {formatPrice(product.oldPrice, locale)}
                </span>
                <span className="ml-2 font-semibold text-on-dark">
                  {fill(t.promo.save, { amount: formatPrice(product.oldPrice - product.price, locale) })}
                </span>
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
            <QuickAddButton
              variant="full"
              tone="dark"
              className="px-8 min-[420px]:w-auto"
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                price: product.price,
              }}
            />
            <Link
              href={href(`/menu/${product.slug}`)}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full border-[1.5px] border-on-dark/35 px-6 font-semibold transition-colors hover:border-on-dark hover:bg-on-dark hover:text-ink"
            >
              {t.promo.customize}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
