import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "dark" | "light" | "herb" | "sage" | "fx-popular" | "fx-best" | "fx-new";

const tones: Record<Tone, string> = {
  accent: "bg-accent text-on-accent",
  dark: "bg-graphite text-on-dark",
  light: "bg-paper text-ink",
  herb: "bg-herb text-on-ink",
  sage: "bg-sage text-on-accent",
  // Animated pills (see .badge-fx in globals.css).
  "fx-popular": "badge-fx badge-fx-popular",
  "fx-best": "badge-fx badge-fx-best",
  "fx-new": "badge-fx badge-fx-new",
};

/** Small pill label on photos and in lists; never interactive. */
export function Badge({
  tone = "light",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-[0.6875rem] leading-none font-semibold tracking-[0.01em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type BadgeLabels = { sale?: string; isNew: string; popular: string; best: string; spicy?: string; soldOut?: string };

/** Marketing badges for product cards and pages — at most two, by priority. */
export function ProductBadges({
  popular,
  isNew,
  featured,
  spicy,
  soldOut,
  discount,
  labels,
  className,
}: {
  popular: boolean;
  isNew: boolean;
  featured?: boolean;
  spicy?: boolean;
  soldOut?: boolean;
  discount: number | null;
  labels: BadgeLabels;
  className?: string;
}) {
  const items: ReactNode[] = [];
  if (soldOut && labels.soldOut) items.push(<Badge key="out" tone="light">{labels.soldOut}</Badge>);
  if (discount) items.push(<Badge key="sale" tone="accent">−{discount}%</Badge>);
  if (isNew) items.push(<Badge key="new" tone="fx-new">{labels.isNew}</Badge>);
  if (spicy && labels.spicy) items.push(<Badge key="spicy" tone="accent">{labels.spicy}</Badge>);
  if (popular) items.push(<Badge key="pop" tone="fx-popular">{labels.popular}</Badge>);
  else if (featured) items.push(<Badge key="best" tone="fx-best">{labels.best}</Badge>);
  if (items.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{items.slice(0, 2)}</div>;
}

/** The discount as a diagonal ribbon in the top-right corner of a picture (the picture's box must be `relative`); `lg` for large pictures. */
export function DiscountRibbon({ percent, size = "md" }: { percent: number | null; size?: "md" | "lg" }) {
  if (!percent) return null;
  const lg = size === "lg";
  return (
    <span className={cn("pointer-events-none absolute top-0 right-0 overflow-hidden", lg ? "size-28" : "size-20")}>
      <span
        className={cn(
          "absolute rotate-45 bg-[#8b1a1a] text-center font-display font-extrabold tracking-[-0.01em] text-white",
          lg ? "top-[1.6rem] -right-[3.9rem] w-44 py-1 text-base leading-5" : "top-[1.125rem] -right-[2.75rem] w-32 py-0.5 text-[0.8125rem] leading-4",
        )}
      >
        −{percent}%
      </span>
    </span>
  );
}
