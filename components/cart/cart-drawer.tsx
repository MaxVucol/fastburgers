"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { cartActions, lineUnitPrice, useCart } from "./cart-store";
import { QuantityStepper } from "./quantity-stepper";

export function CartDrawer() {
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

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      onClose={() => cartActions.close()}
      onClick={(e) => {
        if (e.target === e.currentTarget) cartActions.close();
      }}
      className="drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md bg-ivory p-0 shadow-[var(--shadow-drawer)] sm:rounded-l-3xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="text-xl font-extrabold">
            Coșul tău{" "}
            {count > 0 && <span className="text-muted">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={() => cartActions.close()}
            className="grid size-10 place-items-center rounded-xl hover:bg-sand"
            aria-label="Închide coșul"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-sand">
              <ShoppingBag className="size-9 text-muted" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-bold">Coșul este gol</p>
              <p className="mt-1 text-sm text-muted">Adaugă ceva bun din meniu — durează câteva secunde.</p>
            </div>
            <ButtonLink href="/menu" onClick={() => cartActions.close()}>
              Vezi meniul
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-cream px-5 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                <Truck className="size-4 text-herb" aria-hidden />
                {remaining > 0 ? (
                  <span>
                    Mai adaugă <strong>{formatPrice(remaining)}</strong> pentru livrare gratuită
                  </span>
                ) : (
                  <span className="font-semibold text-herb">Ai livrare gratuită!</span>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-oat" aria-hidden>
                <div
                  className="h-full rounded-full bg-herb transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5" aria-label="Produse în coș">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-3.5 py-4">
                  <Link
                    href={`/menu/${line.slug}`}
                    onClick={() => cartActions.close()}
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/menu/${line.slug}`}
                        onClick={() => cartActions.close()}
                        className="leading-tight font-bold hover:text-accent"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => cartActions.remove(line.key)}
                        className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-sand hover:text-accent"
                        aria-label={`Elimină ${line.name} din coș`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                    {line.options.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted">
                        + {line.options.map((o) => o.name).join(", ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <QuantityStepper
                        size="sm"
                        min={0}
                        value={line.quantity}
                        label={line.name}
                        onChange={(q) => cartActions.setQuantity(line.key, q)}
                      />
                      <span className="font-bold tabular-nums">
                        {formatPrice(lineUnitPrice(line) * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-line bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-xl font-extrabold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Taxa de livrare se calculează la pasul următor.</p>
              <ButtonLink
                href="/checkout"
                size="lg"
                className="w-full"
                onClick={() => cartActions.close()}
              >
                Finalizează comanda
              </ButtonLink>
              <button
                type="button"
                onClick={() => cartActions.close()}
                className="w-full py-1.5 text-sm font-semibold text-muted hover:text-ink"
              >
                Continuă cumpărăturile
              </button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
