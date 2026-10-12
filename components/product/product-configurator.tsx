"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { cartActions } from "@/components/cart/cart-store";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { optionName } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { ProductOptionView } from "@/types/catalog";

export function ProductConfigurator({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    options: ProductOptionView[];
    /** Temporarily not orderable: the add button is disabled. */
    soldOut?: boolean;
  };
}) {
  const { locale, t } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  const chosen = product.options.filter((o) => selected.includes(o.id));
  const unitPrice = product.price + chosen.reduce((sum, o) => sum + o.price, 0);
  const total = unitPrice * quantity;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addToCart() {
    cartActions.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        basePrice: product.price,
        // Stored with the canonical (Romanian) name; displayed translated.
        options: chosen.map((o) => ({ id: o.id, name: o.name, price: o.price })),
      },
      quantity,
      true,
    );
    setAdded(true);
    setSelected([]);
    setQuantity(1);
  }

  return (
    <div className="space-y-7">
      {product.options.length > 0 && (
        <fieldset>
          <legend className="type-eyebrow mb-3 text-ink">{t.product.extras}</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <li key={option.id}>
                  <label
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border-[1.5px] px-3.5 py-2.5 transition-colors duration-[var(--duration-fast)]",
                      "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25",
                      checked ? "border-ink bg-paper" : "border-line hover:border-ink/35",
                    )}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="peer sr-only" />
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[0.3rem] border-[1.5px] transition-colors",
                        checked ? "border-accent bg-accent text-on-accent" : "border-oat bg-paper",
                      )}
                      aria-hidden
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-sm font-semibold">{optionName(option.name, t.options)}</span>
                    <span className="text-sm text-muted tabular-nums">
                      {option.price > 0 ? `+${formatPrice(option.price, locale)}` : t.product.optionFree}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div className="rounded-[var(--radius-card)] bg-graphite p-4 text-on-dark sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} tone="dark" />
          <div className="text-right">
            <p className="text-xs font-semibold text-muted-on-dark">{t.common.total}</p>
            <p className="font-display text-3xl leading-none font-semibold text-flame tabular-nums" aria-live="polite">
              {formatPrice(total, locale)}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          variant={added ? "light" : "primary"}
          onClick={addToCart}
          disabled={product.soldOut}
          className="mt-4 w-full px-4 whitespace-normal"
        >
          {added ? <Check className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden strokeWidth={2.5} />}
          <span>
            {product.soldOut ? t.product.soldOut : added ? t.product.addedToCart : fill(t.product.addWithTotal, { total: formatPrice(total, locale) })}
          </span>
        </Button>
        {/* Announces only the confirmation; the new total is announced by the total above. */}
        <span className="sr-only" aria-live="polite">
          {added ? t.product.addedToCart : ""}
        </span>
      </div>
    </div>
  );
}
