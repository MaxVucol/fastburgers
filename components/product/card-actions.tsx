"use client";

import { Eye, ShoppingCart, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { useRef, useState } from "react";
import { productOptionsAction } from "@/actions/catalog";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { useCloseOnHide } from "@/components/layout/use-close-on-hide";
import { useI18n } from "@/components/i18n/i18n-provider";
import { buttonStyles } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
import { ProductConfigurator } from "./product-configurator";
import type { ProductCardData, ProductOptionView } from "@/types/catalog";

/** Small dark label above an icon, shown instantly on hover or keyboard focus (no animation). */
function Tip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-[0.25rem] bg-ink px-2.5 py-1.5 text-[0.6875rem] leading-none font-semibold tracking-[0.04em] whitespace-nowrap text-on-ink uppercase group-focus-within/tip:block group-hover/tip:block"
      >
        {label}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ink" />
      </span>
    </span>
  );
}

function QuickView({ product, hideOnPhone = false }: { product: ProductCardData; hideOnPhone?: boolean }) {
  const { locale, t, href } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useCloseOnHide(ref);
  const close = () => ref.current?.close();

  return (
    <>
      <Tip label={t.product.quickView} className={hideOnPhone ? "max-sm:hidden" : undefined}>
        <button
          type="button"
          onClick={() => ref.current?.showModal()}
          aria-label={t.product.quickView}
          aria-haspopup="dialog"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink hover:text-accent-ink"
        >
          <Eye className="size-6" aria-hidden strokeWidth={1.8} />
        </button>
      </Tip>
      <dialog
        ref={ref}
        aria-label={product.name}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="sheet mx-auto my-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-[var(--radius-panel)] bg-cream p-0 text-ink shadow-[var(--shadow-lift)] dark:border dark:border-line dark:bg-paper"
      >
        <div className="relative grid md:grid-cols-2">
          <button
            type="button"
            onClick={close}
            aria-label={t.product.quickViewClose}
            className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-paper/90 text-ink hover:bg-sand"
          >
            <X className="size-5" aria-hidden />
          </button>
          <div className="relative aspect-[4/3] bg-sand md:aspect-auto md:min-h-[22rem]">
            <SmartImage src={product.image} alt={product.name} fill sizes="(min-width: 768px) 384px, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col p-6 sm:p-8">
            <h2 className="pr-10 font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] md:pr-0">{product.name}</h2>
            {product.weight ? (
              <p className="mt-1 text-sm text-muted tabular-nums">
                {product.weight} {product.weightUnit}
              </p>
            ) : null}
            <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} size="lg" className="mt-4" />
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{product.description || product.shortDescription}</p>
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <QuickAddButton
                variant="full"
                product={{ id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price, soldOut: product.soldOut }}
              />
              <Link href={href(`/menu/${product.slug}`)} onClick={close} className="text-center text-sm font-semibold text-ink-soft underline-offset-4 hover:text-accent-ink hover:underline">
                {t.product.fullDetails}
              </Link>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * Quick view and wishlist icons on a catalog card. They appear when the card is hovered or has
 * keyboard focus (always on touch screens, which have no hover), with a label above each.
 */
export function CardActions({ product, dense = false }: { product: ProductCardData; dense?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="relative z-10 flex items-center opacity-0 transition-opacity duration-300 ease-out group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
      <QuickView product={product} hideOnPhone={dense} />
      <Tip label={t.product.wishlist}>
        <FavoriteButton productId={product.id} variant="card" />
      </Tip>
    </div>
  );
}

/**
 * The round "+" of a catalog card. A dish with extras opens a window with its options (the same
 * choice, quantity and total as on the dish page) instead of adding it blindly; a dish without any
 * is added at once. The options are fetched when the window first opens.
 */
export function CardAdd({ product }: { product: ProductCardData }) {
  const addable = { id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price, soldOut: product.soldOut };
  if (product.soldOut || product.optionCount === 0) return <QuickAddButton variant="icon" className="relative z-10" product={addable} />;
  return <OptionsAdd product={product} addable={addable} />;
}

function OptionsAdd({ product, addable }: { product: ProductCardData; addable: Parameters<typeof QuickAddButton>[0]["product"] & { id: string } }) {
  const { locale, t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useCloseOnHide(ref);
  const [options, setOptions] = useState<ProductOptionView[] | null>(null);
  const close = () => ref.current?.close();

  function open() {
    ref.current?.showModal();
    if (options) return;
    // If the options cannot be read, the dish can still be added without extras.
    productOptionsAction(product.slug)
      .then(setOptions)
      .catch(() => setOptions([]));
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={fill(t.product.addToCartNamed, { name: product.name })}
        className={buttonStyles({ variant: "primary", size: "icon", className: "relative z-10 size-11" })}
      >
        <ShoppingCart className="size-5 text-white" aria-hidden strokeWidth={2.2} />
      </button>
      <dialog
        ref={ref}
        aria-label={product.name}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="sheet mx-auto my-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[var(--radius-panel)] bg-cream p-0 text-ink shadow-[var(--shadow-lift)] dark:border dark:border-line dark:bg-paper"
      >
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-sand">
              <SmartImage src={product.image} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.02em]">{product.name}</h2>
              <Price price={product.price} oldPrice={product.oldPrice} locale={locale} oldPriceLabel={t.product.oldPrice} size="sm" className="mt-1" />
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t.product.quickViewClose}
              className="grid size-10 shrink-0 place-items-center self-start rounded-full text-muted hover:bg-sand hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {options === null ? (
            <div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-sand" role="status" aria-label={t.product.loading} />
          ) : (
            <ProductConfigurator product={{ ...addable, options }} onAdded={close} />
          )}
        </div>
      </dialog>
    </>
  );
}
