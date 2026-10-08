"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartActions } from "./cart-store";

type QuickAddProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

/** One-tap add from product cards (base configuration, no extras). */
export function QuickAddButton({
  product,
  variant = "compact",
  inverse = false,
  className,
}: {
  product: QuickAddProduct;
  variant?: "compact" | "full";
  /** White button for use on the accent-coloured promo banner. */
  inverse?: boolean;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(t);
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

  const label = added ? "Adăugat" : "Adaugă în coș";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={
          inverse
            ? buttonStyles({
                variant: added ? "dark" : "outline",
                size: "md",
                className: cn("w-full", !added && "border-white", className),
              })
            : buttonStyles({
                variant: added ? "dark" : "primary",
                size: "md",
                className: cn("w-full", className),
              })
        }
        aria-label={`${label}: ${product.name}`}
      >
        {added ? <Check className="size-4.5" aria-hidden /> : <ShoppingBag className="size-4.5" aria-hidden />}
        <span aria-live="polite">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonStyles({
        variant: added ? "dark" : "primary",
        size: "sm",
        className: cn("h-10 gap-1.5 px-3.5", className),
      })}
      aria-label={`${label}: ${product.name}`}
    >
      {added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
      <span aria-live="polite">{added ? "Adăugat" : "Adaugă"}</span>
    </button>
  );
}
