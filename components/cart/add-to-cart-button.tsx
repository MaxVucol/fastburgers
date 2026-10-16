"use client";

import { Check, Plus, ShoppingCart } from "lucide-react";
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
  /** Temporarily not orderable: the button is shown disabled with a "not available" label. */
  soldOut?: boolean;
};

/** One-tap add from cards and the promo block (base configuration, no extras). */
export function QuickAddButton({
  product,
  variant = "compact",
  tone = "light",
  className,
}: {
  product: QuickAddProduct;
  /** compact: "Add +" · full: wide button with the full label · icon: round "+" on catalog cards. */
  variant?: "compact" | "full" | "icon";
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

  if (product.soldOut) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-line px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-muted",
          tone === "dark" && "border-line-dark text-muted-on-dark",
          className,
        )}
      >
        {t.product.soldOut}
      </span>
    );
  }

  const doneVariant = tone === "dark" ? "light" : "dark";
  const label = variant === "full" ? (added ? t.product.addedToCart : t.product.addToCart) : added ? t.product.added : t.product.add;
  const ariaLabel = fill(added ? t.product.addedNamed : t.product.addToCartNamed, { name: product.name });

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={buttonStyles({
          variant: added ? doneVariant : "primary",
          size: "icon",
          className: cn("size-11", className),
        })}
        aria-label={ariaLabel}
      >
        <span className="sr-only" aria-live="polite">
          {added ? t.product.added : ""}
        </span>
        {added ? (
          <Check className="size-5 animate-pop" aria-hidden strokeWidth={2.5} />
        ) : (
          <ShoppingCart className="size-5 text-white" aria-hidden strokeWidth={2.2} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonStyles({
        variant: added ? doneVariant : "primary",
        size: variant === "full" ? "lg" : "sm",
        className: cn(variant === "compact" ? "h-10 gap-1.5 pr-3.5 pl-4" : "w-full", className),
      })}
      aria-label={ariaLabel}
    >
      <span aria-live="polite">{label}</span>
      {added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden strokeWidth={2.5} />}
    </button>
  );
}
