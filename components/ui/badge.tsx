import { Flame, Sparkles, Tag, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "mustard" | "herb" | "neutral" | "dark";

const tones: Record<Tone, string> = {
  accent: "bg-accent text-white",
  mustard: "bg-mustard text-ink",
  herb: "bg-herb text-white",
  neutral: "bg-ivory/95 text-ink ring-1 ring-line",
  dark: "bg-ink text-white",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-bold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Marketing badges shown on product cards and product pages (max two, by priority). */
export function ProductBadges({
  popular,
  isNew,
  featured,
  discount,
  className,
}: {
  popular: boolean;
  isNew: boolean;
  featured?: boolean;
  discount: number | null;
  className?: string;
}) {
  const items: ReactNode[] = [];
  if (discount) {
    items.push(
      <Badge key="sale" tone="accent" icon={<Tag className="size-3" aria-hidden />}>
        -{discount}%
      </Badge>,
    );
  }
  if (isNew) {
    items.push(
      <Badge key="new" tone="herb" icon={<Sparkles className="size-3" aria-hidden />}>
        Nou
      </Badge>,
    );
  }
  if (popular) {
    items.push(
      <Badge key="pop" tone="mustard" icon={<Flame className="size-3" aria-hidden />}>
        Popular
      </Badge>,
    );
  } else if (featured) {
    items.push(
      <Badge key="best" tone="dark" icon={<Trophy className="size-3" aria-hidden />}>
        Best Seller
      </Badge>,
    );
  }
  if (items.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{items.slice(0, 2)}</div>;
}
