"use client";

import { ShoppingCart } from "lucide-react";
import { cartActions, useCart } from "@/components/cart/cart-store";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatPrice } from "@/lib/format";
import { plural } from "@/lib/i18n/config";
import { headerIcon, headerIconButton } from "./header-icon";

/** Cart icon with an orange count bubble; the full count and total are in the accessible name. */
export function CartButton() {
  const { locale, t } = useI18n();
  const { count, subtotal, bump } = useCart();
  const filled = count > 0;

  return (
    <button
      type="button"
      onClick={() => cartActions.open()}
      className={headerIconButton}
      aria-label={
        filled ? `${plural(locale, count, t.cart.button)}, ${formatPrice(subtotal, locale)}` : t.cart.buttonEmpty
      }
    >
      <ShoppingCart {...headerIcon} />
      {filled && (
        <span
          key={bump}
          className="absolute -top-0.5 -right-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-accent px-1 text-[0.6875rem] leading-none font-bold text-on-accent tabular-nums ring-2 ring-night"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
