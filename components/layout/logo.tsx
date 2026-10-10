import Link from "next/link";
import { Crown } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

/**
 * Compact brand mark: the orange crown on a graphite tile. Used where the full wordmark
 * does not fit (favicon, admin header, small screens).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-grid size-10 place-items-center rounded-[var(--radius-sm)] bg-ink", className)}>
      <Crown className="h-[46%] text-accent" strokeWidth={3.8} />
    </span>
  );
}

/**
 * BUNIQ wordmark: crown over the name, "Burgers & More" underneath. Sized by font-size
 * (everything is in em), so one prop scales the whole lock-up.
 */
export function Wordmark({
  className,
  tone = "light",
  tagline = true,
}: {
  className?: string;
  tone?: "light" | "dark";
  /** Hide the small "Burgers & More" line where it would be too small to read. */
  tagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <Crown className="mb-[0.05em] h-[0.62em] -translate-x-[0.5em] -rotate-[10deg] text-accent" strokeWidth={3.6} />
      <span
        className={cn(
          "font-display text-[1em] leading-[0.8] font-extrabold tracking-[-0.045em]",
          tone === "dark" ? "text-on-dark" : "text-ink",
        )}
      >
        BUNIQ
      </span>
      {tagline && (
        <span
          className={cn(
            "mt-[0.32em] pl-[0.3em] font-display text-[0.25em] font-semibold tracking-[0.3em] whitespace-nowrap uppercase",
            tone === "dark" ? "text-muted-on-dark" : "text-ink-soft",
          )}
        >
          Burgers &amp; More
        </span>
      )}
    </span>
  );
}

export function Logo({
  href = "/",
  label = "BUNIQ",
  tone = "light",
  className,
  onClick,
}: {
  href?: string;
  label?: string;
  tone?: "light" | "dark";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cn("inline-flex rounded-[var(--radius-xs)]", className)} aria-label={label}>
      <Wordmark tone={tone} className="text-[1.75rem] lg:text-[2rem]" />
    </Link>
  );
}
