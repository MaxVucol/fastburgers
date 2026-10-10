import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Spark, Swash } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

/**
 * Left-aligned editorial heading: spark + condensed uppercase title, optional lead,
 * optional handwritten note and a quiet text link on the right.
 */
export function SectionHeading({
  title,
  lead,
  note,
  action,
  id,
  tone = "light",
  className,
}: {
  title: ReactNode;
  lead?: string;
  note?: string;
  action?: { href: string; label: string };
  id?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("mb-8 grid gap-x-10 gap-y-4 sm:mb-10 md:grid-cols-[1fr_auto] md:items-end", className)}>
      <div className="max-w-2xl">
        <h2 id={id} className={cn("type-h2 flex items-start gap-3", dark ? "text-on-dark" : "text-ink")}>
          <Spark className="mt-[0.12em] size-[0.62em] shrink-0 text-accent" />
          <span>{title}</span>
        </h2>
        {lead && (
          <p className={cn("mt-3 max-w-xl text-base sm:text-lg", dark ? "text-muted-on-dark" : "text-muted")}>
            {lead}
          </p>
        )}
      </div>
      {(note || action) && (
        <div className="flex flex-col items-start gap-3 md:items-end">
          {note && (
            <p className={cn("type-script hidden -rotate-3 text-[1.65rem] md:block", dark ? "text-flame" : "text-accent-ink")}>
              {note}
              <Swash className="mt-0.5 ml-auto h-2.5 w-20" />
            </p>
          )}
          {action && (
            <Link
              href={action.href}
              className={cn(
                "group inline-flex items-center gap-1.5 border-b-[1.5px] pb-0.5 text-sm font-semibold transition-colors",
                dark
                  ? "border-on-dark/40 text-on-dark hover:border-flame hover:text-flame"
                  : "border-ink/30 text-ink hover:border-accent-ink hover:text-accent-ink",
              )}
            >
              {action.label}
              <ArrowUpRight
                className="size-4 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
