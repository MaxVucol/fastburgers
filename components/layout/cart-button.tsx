"use client";

import { ShoppingBag } from "lucide-react";
import { cartActions, useCart } from "@/components/cart/cart-store";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatPrice } from "@/lib/format";
import { plural } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function CartButton() {
  const { locale, t } = useI18n();
  const { count, subtotal, bump } = useCart();
  const filled = count > 0;

  return (
    <button
      type="button"
      onClick={() => cartActions.open()}
      className={cn(
        "relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 font-semibold transition-colors duration-[var(--duration-base)]",
        filled ? "bg-ink text-on-dark hover:bg-graphite-soft" : "text-ink hover:bg-sand",
      )}
      aria-label={
        filled ? `${plural(locale, count, t.cart.button)}, ${formatPrice(subtotal, locale)}` : t.cart.buttonEmpty
      }
    >
      <ShoppingBag className="size-5" aria-hidden strokeWidth={1.9} />
      {filled && (
        <>
          <span key={bump} className="animate-pop text-sm tabular-nums" aria-hidden>
            {count}
          </span>
          <span className="hidden text-sm text-muted-on-dark tabular-nums xl:inline" aria-hidden>
            · {formatPrice(subtotal, locale)}
          </span>
        </>
      )}
    </button>
  );
}
