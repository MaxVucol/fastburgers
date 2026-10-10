import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { Spark } from "@/components/ui/brand";
import { discountPercent, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

/** The page's one big contrast moment: full-bleed graphite, photo bleeding off the left edge. */
export async function PromoBanner({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <section aria-labelledby="promo-title" className="bg-graphite text-on-dark">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[34rem]">
          <Image
            src="/images/promo/promo.webp"
            alt={t.promo.imageAlt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          {discount && (
            <p className="absolute top-5 right-5 grid size-24 rotate-[8deg] place-items-center rounded-full bg-accent text-center text-ink sm:size-28 lg:top-8 lg:-right-14 lg:size-32">
              <span>
                <span className="block font-display text-3xl leading-none font-bold sm:text-4xl">−{discount}%</span>
                <span className="type-eyebrow mt-1 block text-[0.625rem]">{t.promo.badge}</span>
              </span>
            </p>
          )}
        </div>

        <div className="flex w-full max-w-[42rem] flex-col justify-center px-[var(--gutter)] py-12 sm:py-14 lg:py-16 lg:pl-24 xl:pl-28">
          <p className="type-eyebrow flex items-center gap-2 text-flame">
            <Spark className="size-3.5" />
            {t.promo.eyebrow}
          </p>
          <h2 id="promo-title" className="type-h2 mt-4 max-w-lg">
            {t.promo.title}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-on-dark">
            <span className="font-semibold text-on-dark">{product.name}.</span> {product.shortDescription}
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2">
            <span className="font-display text-5xl leading-none font-semibold text-flame tabular-nums">
              {formatPrice(product.price, locale)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="pb-1 text-muted-on-dark">
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
            <div className="min-[420px]:w-auto">
              <QuickAddButton
                variant="full"
                tone="dark"
                className="px-8"
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                }}
              />
            </div>
            <Link
              href={href(`/menu/${product.slug}`)}
              className="group inline-flex h-13 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-on-dark/40 px-6 font-semibold transition-colors hover:border-on-dark hover:bg-on-dark hover:text-ink"
            >
              {t.promo.customize}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
