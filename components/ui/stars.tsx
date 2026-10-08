import { Star } from "lucide-react";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={className} role="img" aria-label={`${rating} din 5 stele`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={i <= rating ? "size-4 fill-mustard text-mustard" : "size-4 fill-oat text-oat"}
          />
        ))}
      </div>
    </div>
  );
}
