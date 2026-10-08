"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { cartActions } from "@/components/cart/cart-store";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
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
  };
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(t);
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
    <div className="space-y-6">
      {product.options.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold tracking-wider text-ink uppercase">Extra-uri și opțiuni</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <li key={option.id}>
                  <label
                    className={cn(
                      "flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 transition-colors",
                      checked ? "border-accent bg-accent-soft/50" : "border-line hover:border-ink/20",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.id)}
                      className="size-5 shrink-0 cursor-pointer accent-accent"
                    />
                    <span className="flex-1 text-sm font-semibold">{option.name}</span>
                    <span className="text-sm font-semibold text-muted tabular-nums">
                      {option.price > 0 ? `+${formatPrice(option.price)}` : "gratuit"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} />
          <div className="text-right">
            <p className="text-xs font-semibold text-muted">Total</p>
            <p className="font-display text-3xl font-extrabold tabular-nums" aria-live="polite">
              {formatPrice(total)}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          variant={added ? "dark" : "primary"}
          onClick={addToCart}
          className="mt-4 w-full px-4 whitespace-normal"
        >
          {added ? <Check className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}
          <span aria-live="polite">
            {added ? "Adăugat în coș" : `Adaugă în coș · ${formatPrice(total)}`}
          </span>
        </Button>
      </div>
    </div>
  );
}
