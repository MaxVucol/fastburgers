"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontal, snap-scrolling list of cards with previous / next buttons, on every width:
 * swipe on touch screens, the buttons (or the scrollbar-free trackpad / Shift+wheel) elsewhere.
 * Each button scrolls by one visible page and is disabled at its end of the list; both are
 * hidden when everything already fits.
 * `children` are the `<li>` items; `footer` sits left of the buttons (e.g. a "see all" link).
 */
export function ScrollRail({
  children,
  label,
  prevLabel,
  nextLabel,
  footer,
  className,
}: {
  children: ReactNode;
  /** Accessible name of the list. */
  label: string;
  prevLabel: string;
  nextLabel: string;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function page(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  }

  const button =
    "grid size-12 place-items-center rounded-full border-[1.5px] border-ink/80 text-ink transition-colors duration-[var(--duration-fast)] hover:bg-ink hover:text-on-dark active:scale-95 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className={className}>
      <ul
        ref={ref}
        id={listId}
        aria-label={label}
        className={cn(
          "no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-2 sm:gap-5",
          // Phones: one card and a clear peek of the next; tablets: two and a peek; desktop: three,
          // four from `xl` (narrower cards would squeeze names and prices).
          "[&>li]:flex [&>li]:w-[min(74vw,18.5rem)] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-2.5rem)/2.3)] lg:[&>li]:w-[calc((100%-2.5rem)/3)] xl:[&>li]:w-[calc((100%-3.75rem)/4)]",
          "lg:mx-0 lg:scroll-px-0 lg:px-0",
        )}
      >
        {children}
      </ul>
      {/* Phones: the buttons on their own line above the footer, which then takes the full width. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-5 sm:mt-8">
        <div className="order-2 w-full sm:order-1 sm:w-auto">{footer}</div>
        <div className={cn("order-1 ml-auto flex shrink-0 gap-2 sm:order-2", edges.start && edges.end && "hidden")}>
          <button type="button" className={button} onClick={() => page(-1)} disabled={edges.start} aria-label={prevLabel} aria-controls={listId}>
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button type="button" className={button} onClick={() => page(1)} disabled={edges.end} aria-label={nextLabel} aria-controls={listId}>
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
