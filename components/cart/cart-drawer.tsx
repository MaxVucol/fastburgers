"use client";

import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Truck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { optionName } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { richFill } from "@/lib/i18n/rich";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { cartActions, lineLabel, lineUnitPrice, useCart } from "./cart-store";
import { QuantityStepper } from "./quantity-stepper";

export function CartDrawer() {
  const { locale, t, href } = useI18n();
  const { lines, open, count, subtotal } = useCart();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const close = () => cartActions.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[28rem] bg-cream p-0 shadow-[var(--shadow-drawer)] dark:border-l dark:border-line"
    >
      <div className="flex h-full flex-col">
        <header className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-5 sm:px-6">
          <h2 id="cart-title" className="flex items-baseline gap-2 font-display text-2xl font-extrabold tracking-[-0.02em]">
            {t.cart.title}
            {count > 0 && <span className="text-base font-medium text-muted tabular-nums">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            className="grid size-11 place-items-center rounded-full hover:bg-sand"
            aria-label={t.cart.close}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-20 place-items-center rounded-full border-[1.5px] border-dashed border-oat">
              <ShoppingBag className="size-8 text-muted" aria-hidden strokeWidth={1.6} />
            </span>
            <p className="mt-5 font-display text-2xl font-extrabold tracking-[-0.02em]">{t.cart.emptyTitle}</p>
            <p className="mt-2 max-w-xs text-sm text-muted">{t.cart.emptyText}</p>
            <ButtonLink href={href("/menu")} onClick={close} className="mt-7">
              {t.common.viewMenu}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-3.5 sm:px-6">
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Truck className="size-4 shrink-0 text-ink" aria-hidden />
                {remaining > 0 ? (
                  <span>
                    {richFill(t.cart.freeLeft, {
                      amount: <strong className="text-ink tabular-nums">{formatPrice(remaining, locale)}</strong>,
                    })}
                  </span>
                ) : (
                  <span className="font-semibold text-herb">{t.cart.freeReached}</span>
                )}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-oat" aria-hidden>
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-brand)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-6" aria-label={t.cart.items}>
              {lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-4">
                  <Link
                    href={href(`/menu/${line.slug}`)}
                    onClick={close}
                    className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-sand"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <SmartImage src={line.image} alt="" fill sizes="72px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={href(`/menu/${line.slug}`)}
                        onClick={close}
                        className="font-display text-lg leading-tight font-semibold hover:text-accent-ink"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => cartActions.remove(line.key)}
                        className="-mt-1 -mr-2 grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
                        aria-label={fill(t.cart.remove, { name: lineLabel(line, (n) => optionName(n, t.options)) })}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    {line.options.length > 0 && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        + {line.options.map((o) => optionName(o.name, t.options)).join(", ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                      <QuantityStepper
                        size="sm"
                        min={0}
                        value={line.quantity}
                        label={lineLabel(line, (n) => optionName(n, t.options))}
                        onChange={(q) => cartActions.setQuantity(line.key, q)}
                      />
                      <span className="font-semibold tabular-nums">
                        {formatPrice(lineUnitPrice(line) * line.quantity, locale)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-line bg-ivory px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-muted">{t.common.subtotal}</span>
                <span className="font-display text-[1.75rem] leading-none font-semibold tabular-nums">
                  {formatPrice(subtotal, locale)}
                </span>
              </div>
              <p className="text-xs text-muted">{t.cart.feeNote}</p>
              <ButtonLink href={href("/checkout")} size="lg" className="w-full" onClick={close}>
                {t.cart.checkout}
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <button
                type="button"
                onClick={close}
                className="w-full py-1.5 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {t.cart.continue}
              </button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
