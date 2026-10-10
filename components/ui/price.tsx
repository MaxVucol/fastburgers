import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Prices are set in the display face. `tone="dark"` is for dark surfaces, where the
 * price turns flame orange; on light surfaces it stays ink (orange text would fail AA).
 */
export function Price({
  price,
  oldPrice,
  locale,
  oldPriceLabel,
  size = "md",
  tone = "light",
  className,
}: {
  price: number;
  oldPrice?: number | null;
  locale: Locale;
  oldPriceLabel: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
}) {
  const hasDiscount = oldPrice != null && oldPrice > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-display font-extrabold tracking-[-0.02em] tabular-nums",
          tone === "dark" ? "text-flame" : "text-ink",
          size === "sm" && "text-base",
          size === "md" && "text-[1.1875rem]",
          size === "lg" && "text-[2rem]",
        )}
      >
        {formatPrice(price, locale)}
      </span>
      {hasDiscount && (
        <span
          className={cn(
            "line-through tabular-nums",
            tone === "dark" ? "text-muted-on-dark" : "text-muted",
            size === "lg" ? "text-lg" : "text-sm",
          )}
        >
          <span className="sr-only">{oldPriceLabel} </span>
          {formatPrice(oldPrice, locale)}
        </span>
      )}
    </div>
  );
}
