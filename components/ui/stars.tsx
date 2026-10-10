import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, label, className }: { rating: number; label: string; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={0}
          className={cn("size-4", i <= rating ? "fill-accent" : "fill-oat")}
        />
      ))}
    </span>
  );
}
