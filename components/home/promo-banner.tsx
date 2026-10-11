import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { Crown } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { discountPercent, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

/**
 * Combo promo — a wide poster band on the near-black stage: the combo's name set as a headline
 * with what is in it and the price on the left, the combo photo in the middle (with the discount
 * beside it), and the call to action on the right. Phones: title and price, the combo, then the actions.
 * Discount, savings and price come from the combo product.
 */
export async function PromoBanner({ product }: { product: ProductCardData }) {
  const { locale, t, href } = await getI18n();
  const discount = discountPercent(product.price, product.oldPrice);
  // The photo shows the Classic Combo (burger, fries and a can of Coca-Cola); any other combo
  // promoted here gets the generic promo photo.
  const photo = product.slug === "classic-combo" ? "/images/promo/classic-combo.webp" : "/images/promo/promo.webp";

  return (
    <section
      aria-labelledby="promo-title"
      className="overflow-hidden border-t border-line-dark bg-night bg-[radial-gradient(ellipse_at_55%_58%,rgb(255_107_46/0.28),transparent_45%)] text-on-dark"
    >
      <div className="container-page grid items-center gap-x-6 gap-y-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.62fr)] xl:py-20">
        {/* ── Name, contents and price ── */}
        <div className="relative z-10 lg:col-start-1 lg:row-start-1 lg:self-end xl:self-center">
          <p className="type-eyebrow flex items-center gap-2 text-flame">
            <Crown className="h-3.5" />
            {t.promo.eyebrow}
          </p>
          <h2 id="promo-title" className="mt-4 font-display text-[clamp(2.75rem,8vw,5rem)] leading-[0.9] font-black tracking-[-0.045em] text-on-dark uppercase">
            {product.name}
          </h2>
          <p className="mt-4 max-w-md text-[1.0625rem] font-semibold text-on-dark sm:text-lg">{t.promo.title}</p>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-on-dark">{product.shortDescription}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-display text-[clamp(2.5rem,6vw,3.5rem)] leading-none font-black tracking-[-0.045em] whitespace-nowrap text-flame tabular-nums">
              {formatPrice(product.price, locale)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <>
                <span className="text-base text-muted-on-dark line-through tabular-nums">
                  <span className="sr-only">{t.product.oldPrice} </span>
                  {formatPrice(product.oldPrice, locale)}
                </span>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-[0.8125rem] font-semibold whitespace-nowrap text-flame">
                  {fill(t.promo.save, { amount: formatPrice(product.oldPrice - product.price, locale) })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── The combo photo (burger, fries and a drink on one board) with the discount at its left.
            The photo spills past its slot on every side and its edges fade out wide, so its own dark
            background runs straight into the stage: no visible frame, the board and the warm light stay. ── */}
        <div className="relative mx-auto aspect-[2/1] w-full max-w-[46rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none xl:row-span-1">
          {/* The whole 3:1 photo, wider than its slot and centred on it, so nothing is cropped; the copy
              and the buttons sit above it (z-10). */}
          <div className="absolute top-1/2 left-1/2 aspect-[3/1] w-[150%] -translate-x-[52%] -translate-y-1/2">
            <Image
              src={photo}
              alt={t.promo.imageAlt}
              fill
              sizes="(min-width: 1280px) 880px, (min-width: 1024px) 80vw, 150vw"
              className="photo-blend object-cover brightness-[1.08] saturate-[1.05]"
            />
          </div>
          {discount && (
            <p className="absolute top-[34%] left-[3%] -rotate-6 rounded-xl bg-accent px-3.5 py-1.5 text-center font-display text-xl leading-none font-extrabold tracking-[-0.03em] text-on-accent shadow-[var(--shadow-lift)] sm:text-2xl">
              −{discount}%<span className="sr-only"> {t.promo.badge}</span>
            </p>
          )}
        </div>

        {/* ── Actions: go to the combos; or add this one straight away (+), or customise it ── */}
        <div className="relative z-10 flex flex-col gap-3 lg:col-start-1 lg:row-start-2 lg:max-w-sm lg:self-start xl:col-start-3 xl:row-start-1 xl:max-w-none xl:self-center">
          <ButtonLink href={href("/categorii/combo")} size="lg" className="w-full px-8">
            {t.promo.cta}
            <ArrowRight className="size-4.5" aria-hidden />
          </ButtonLink>
          <div className="flex items-center justify-center gap-3">
            <QuickAddButton
              variant="icon"
              tone="dark"
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price }}
            />
            <Link
              href={href(`/menu/${product.slug}`)}
              className="group inline-flex min-h-11 items-center gap-2 font-semibold whitespace-nowrap text-on-dark underline-offset-4 hover:text-flame hover:underline"
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
