import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Swash } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

/**
 * Section heading: dense Montserrat title, optional lead, optional handwritten note and a
 * quiet "view all →" link aligned to the title's baseline on wider screens.
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
    <div className={cn("mb-7 grid gap-x-10 gap-y-3 sm:mb-9 md:grid-cols-[1fr_auto] md:items-end", className)}>
      <div className="max-w-2xl">
        <h2 id={id} className={cn("type-h2", dark ? "text-on-dark" : "text-ink")}>
          {title}
        </h2>
        {lead && (
          <p className={cn("mt-2.5 max-w-xl text-[0.9375rem] sm:text-base", dark ? "text-muted-on-dark" : "text-muted")}>
            {lead}
          </p>
        )}
      </div>
      {(note || action) && (
        <div className="flex flex-col items-start gap-2 md:items-end">
          {note && (
            <p className={cn("type-script hidden -rotate-3 text-[1.6rem] md:block", dark ? "text-flame" : "text-accent-ink")}>
              {note}
              <Swash className="mt-0.5 ml-auto h-2.5 w-20" />
            </p>
          )}
          {action && (
            <Link
              href={action.href}
              className={cn(
                "group inline-flex min-h-10 items-center gap-2 text-sm font-semibold transition-colors",
                dark ? "text-on-dark hover:text-flame" : "text-ink hover:text-accent-ink",
              )}
            >
              {action.label}
              <ArrowRight
                className={cn(
                  "size-4 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-1",
                  dark ? "text-flame" : "text-accent-ink",
                )}
                aria-hidden
              />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
