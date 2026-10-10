import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "dark" | "light" | "herb";

const tones: Record<Tone, string> = {
  accent: "bg-accent text-ink",
  dark: "bg-ink text-on-dark",
  light: "bg-cream text-ink",
  herb: "bg-herb text-white",
};

/** Small square-cornered label: deliberately not a pill, so it reads as a tag, not a button. */
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
        "inline-flex items-center rounded-[var(--radius-xs)] px-2 py-1 text-[0.6875rem] leading-none font-bold tracking-[0.08em] uppercase",
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
  if (isNew) items.push(<Badge key="new" tone="herb">{labels.isNew}</Badge>);
  if (popular) items.push(<Badge key="pop" tone="dark">{labels.popular}</Badge>);
  else if (featured) items.push(<Badge key="best" tone="light">{labels.best}</Badge>);
  if (items.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{items.slice(0, 2)}</div>;
}
