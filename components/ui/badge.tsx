import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "dark" | "light" | "herb" | "sage";

const tones: Record<Tone, string> = {
  accent: "bg-accent text-on-accent",
  dark: "bg-graphite text-on-dark",
  light: "bg-paper text-ink",
  herb: "bg-herb text-on-ink",
  sage: "bg-sage text-on-accent",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] leading-none font-semibold tracking-[0.01em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type BadgeLabels = { sale?: string; isNew: string; popular: string; best: string };

/** Marketing badges for product cards and pages — at most two, by priority. */
export function ProductBadges({
  popular,
  isNew,
  featured,
  discount,
  labels,
  className,
}: {
  popular: boolean;
  isNew: boolean;
  featured?: boolean;
  discount: number | null;
  labels: BadgeLabels;
  className?: string;
}) {
  const items: ReactNode[] = [];
  if (discount) items.push(<Badge key="sale" tone="accent">−{discount}%</Badge>);
  if (isNew) items.push(<Badge key="new" tone="sage">{labels.isNew}</Badge>);
  if (popular) items.push(<Badge key="pop" tone="dark">{labels.popular}</Badge>);
  else if (featured) items.push(<Badge key="best" tone="light">{labels.best}</Badge>);
  if (items.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{items.slice(0, 2)}</div>;
}
