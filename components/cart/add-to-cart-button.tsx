"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { buttonStyles } from "@/components/ui/button";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { cartActions } from "./cart-store";

type QuickAddProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

/** One-tap add from cards and the promo block (base configuration, no extras). */
export function QuickAddButton({
  product,
  variant = "compact",
  tone = "light",
  className,
}: {
  product: QuickAddProduct;
  /** compact: "Add +" on cards · full: wide button with the full label. */
  variant?: "compact" | "full";
  /** dark: the button sits on a graphite surface. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const { t } = useI18n();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1500);
    return () => window.clearTimeout(timer);
  }, [added]);

  function handleClick() {
    cartActions.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      options: [],
    });
    setAdded(true);
  }

  const doneVariant = tone === "dark" ? "light" : "dark";
  const label = variant === "full" ? (added ? t.product.addedToCart : t.product.addToCart) : added ? t.product.added : t.product.add;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonStyles({
        variant: added ? doneVariant : "primary",
        size: variant === "full" ? "lg" : "sm",
        className: cn(variant === "compact" ? "h-10 gap-1.5 pr-3.5 pl-4" : "w-full", className),
      })}
      aria-label={fill(added ? t.product.addedNamed : t.product.addToCartNamed, { name: product.name })}
    >
      <span aria-live="polite">{label}</span>
      {added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden strokeWidth={2.5} />}
    </button>
  );
}
