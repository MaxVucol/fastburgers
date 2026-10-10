import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { Crown, ScribbleArrow, Strokes } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { discountPercent, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/catalog";

/** Soft oval vignette so photos shot on dark backgrounds melt into the graphite panel. */
const MELT = "[mask-image:radial-gradient(closest-side,#000_52%,transparent_96%)]";

/**
 * Combo promo: a wide graphite panel with a warm glow, copy and the real price on the left,
 * and on the right the combo itself — burger, fries and a drink — assembled from the menu's
 * own product photos. Discount, savings and price come from the combo product.
 * `parts` are the menu items the combo is made of; without them the single promo photo is used.
 */
export async function PromoBanner({
  product,
  parts,
}: {
  product: ProductCardData;
  /** Image paths of the menu items in the combo. */
  parts?: { burger: string; fries: string; drink: string } | null;
}) {
  const { locale, t, href } = await getI18n();
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <section aria-labelledby="promo-title" className="container-page pb-[var(--section-y)]">
      <div
        className={cn(
          // Near-black graphite (the brand ink, deepened) so the studio shots' black backdrops blend in.
          "relative grid overflow-hidden rounded-[var(--radius-panel)] bg-[color-mix(in_srgb,var(--color-ink)_55%,#000)] text-on-dark",
          "bg-[radial-gradient(ellipse_at_72%_55%,rgb(255_107_46/0.16),transparent_58%)]",
          "xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]",
        )}
      >
        {/* ── The combo (first on phones, right on desktop) ── */}
        <div
          role="img"
          aria-label={t.promo.imageAlt}
          className="relative order-first mx-auto h-[15.5rem] w-full max-w-[38rem] min-[480px]:h-[19rem] sm:h-[24rem] xl:order-last xl:h-auto xl:min-h-[30rem] xl:max-w-none"
        >
          {parts ? (
            <>
              <div className={cn("absolute top-[4%] left-[2%] aspect-square w-[34%] -rotate-6 xl:top-[8%] xl:left-[4%] xl:w-[30%]", MELT)}>
                <Image src={parts.drink} alt="" fill sizes="(min-width: 1280px) 220px, 34vw" className="object-cover" />
              </div>
              <div className={cn("absolute top-[2%] right-[0%] aspect-square w-[40%] xl:top-[5%] xl:right-[2%] xl:w-[38%]", MELT)}>
                <Image src={parts.fries} alt="" fill sizes="(min-width: 1280px) 280px, 40vw" className="object-cover object-[45%_55%]" />
              </div>
              <div
                className={cn(
                  "absolute bottom-[-4%] left-1/2 aspect-[4/3] w-[74%] -translate-x-1/2 xl:bottom-[0%] xl:left-[48%] xl:w-[72%]",
                  MELT,
                )}
              >
                <Image src={parts.burger} alt="" fill sizes="(min-width: 1280px) 520px, 74vw" className="object-cover object-[50%_45%]" />
              </div>
            </>
          ) : (
            <Image
              src="/images/promo/promo.webp"
              alt=""
              fill
              sizes="(min-width: 1344px) 690px, (min-width: 1280px) 52vw, 100vw"
              className={cn("object-cover", MELT)}
            />
          )}

          {/* Brand accents: one crown, sizzle lines by the burger, a handwritten note pointing at it. */}
          <Crown className="absolute top-[7%] left-[40%] h-8 -rotate-12 text-accent sm:h-10 xl:top-[9%] xl:left-[38%] xl:h-11" strokeWidth={3} />
          <Strokes className="absolute bottom-[34%] left-[8%] size-9 -scale-x-100 text-accent sm:size-11 xl:left-[6%]" />
          <p
            aria-hidden
            className="type-script absolute right-[4%] bottom-[8%] hidden items-end gap-1 text-[1.9rem] text-flame sm:flex xl:right-[5%] xl:bottom-[12%] xl:text-[2.2rem]"
          >
            <ScribbleArrow className="mb-2.5 h-8 w-11 -scale-x-100 rotate-[150deg] text-on-dark/75" />
            <span className="-rotate-6 leading-[0.95] before:content-[attr(data-text)]" data-text={t.promo.note} />
          </p>
          {discount && (
            <p className="absolute top-[6%] right-[5%] grid size-20 rotate-[8deg] place-items-center rounded-full bg-accent text-center text-ink shadow-[var(--shadow-lift)] sm:size-24 xl:top-auto xl:right-auto xl:bottom-[8%] xl:left-[6%]">
              <span>
                <span className="block font-display text-2xl leading-none font-extrabold tracking-[-0.03em] sm:text-[1.75rem]">
                  −{discount}%
                </span>
                <span className="mt-1 block text-[0.6875rem] font-semibold">{t.promo.badge}</span>
              </span>
            </p>
          )}
        </div>

        {/* ── Copy ── */}
        <div className="relative flex flex-col justify-center px-6 pt-4 pb-10 sm:px-10 sm:pb-12 xl:py-16 xl:pr-4 xl:pl-14">
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

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-display text-[2.75rem] leading-none font-extrabold tracking-[-0.03em] text-flame tabular-nums">
              {formatPrice(product.price, locale)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-sm text-muted-on-dark">
                <span className="line-through tabular-nums">
                  <span className="sr-only">{t.product.oldPrice} </span>
                  {formatPrice(product.oldPrice, locale)}
                </span>
                <span className="mt-0.5 block font-semibold text-on-dark">
                  {fill(t.promo.save, { amount: formatPrice(product.oldPrice - product.price, locale) })}
                </span>
              </span>
            )}
          </div>

          {/* One action group: go to the combos, or add this one straight away (+), or customise it. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ButtonLink href={href("/categorii/combo")} size="lg" className="flex-1 px-8 min-[420px]:flex-none">
              {t.promo.cta}
              <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
            <QuickAddButton
              variant="icon"
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price }}
            />
            <Link
              href={href(`/menu/${product.slug}`)}
              className="group inline-flex min-h-11 w-full items-center justify-center gap-2 font-semibold text-on-dark underline-offset-4 hover:text-flame hover:underline min-[420px]:ml-3 min-[420px]:w-auto"
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
