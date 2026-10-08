"use client";

import { ShoppingBag } from "lucide-react";
import { cartActions, useCart } from "@/components/cart/cart-store";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartButton() {
  const { count, subtotal, bump } = useCart();
  return (
    <button
      type="button"
      onClick={() => cartActions.open()}
      className={cn(
        "relative inline-flex h-11 items-center gap-2 rounded-xl px-3 font-semibold transition-colors",
        count > 0 ? "bg-ink text-white hover:bg-ink-soft" : "bg-sand text-ink hover:bg-oat",
      )}
      aria-label={count > 0 ? `Coș: ${count} produse, ${formatPrice(subtotal)}` : "Coș gol"}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 && (
        <span className="hidden text-sm tabular-nums lg:inline">{formatPrice(subtotal)}</span>
      )}
      {count > 0 && (
        <span
          key={bump}
          className="absolute -top-1.5 -right-1.5 grid h-5.5 min-w-5.5 animate-pop place-items-center rounded-full bg-accent px-1 text-[0.7rem] font-bold text-white ring-2 ring-cream"
          aria-hidden
        >
          {count}
        </span>
      )}
    </button>
  );
}
