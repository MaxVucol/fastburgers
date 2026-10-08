import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  oldPrice,
  size = "md",
  className,
}: {
  price: number;
  oldPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasDiscount = oldPrice != null && oldPrice > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-display font-extrabold tracking-tight text-ink tabular-nums",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-3xl",
        )}
      >
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className={cn("text-muted line-through tabular-nums", size === "lg" ? "text-lg" : "text-sm")}>
          <span className="sr-only">Preț vechi: </span>
          {formatPrice(oldPrice)}
        </span>
      )}
    </div>
  );
}
