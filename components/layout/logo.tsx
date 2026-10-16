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
      {tagline && " "}
      {tagline && (
        <span
          className={cn(
            "mt-[0.6em] pl-[0.3em] font-display text-[0.25em] font-semibold tracking-[0.3em] whitespace-nowrap uppercase",
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
  size = "md",
  sparkle = false,
  className,
  onClick,
}: {
  href?: string;
  label?: string;
  tone?: "light" | "dark";
  /** "lg": the site header, about 12 % larger than the default lock-up; "xl": the centred logo of the tall desktop header. */
  size?: "md" | "lg" | "xl";
  /** Sesame seeds and sparks drifting through the wordmark (the site header). */
  sparkle?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cn("relative inline-flex rounded-[var(--radius-xs)]", className)} aria-label={label}>
      <Wordmark
        tone={tone}
        className={
          size === "xl"
            ? "text-[3.75rem] xl:text-[4.75rem]"
            : size === "lg"
              ? "text-[1.875rem] lg:text-[2.125rem] xl:text-[2.25rem]"
              : "text-[1.75rem] lg:text-[2rem]"
        }
      />
      {sparkle && <span aria-hidden className="logo-fx pointer-events-none absolute -inset-x-3 -inset-y-2 max-md:scale-[1.7] max-md:[clip-path:inset(calc((100%-var(--header-h)/1.7)/2)_-1rem)]" />}
    </Link>
  );
}
