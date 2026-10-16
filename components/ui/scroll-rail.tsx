"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontal, snap-scrolling list of cards with previous / next buttons, on every width:
 * swipe (or drag with the mouse) everywhere, the buttons, or the scrollbar-free trackpad / Shift+wheel.
 * On desktop the round buttons stand on both sides of the cards, outside them; on phones and tablets they
 * sit under the list. Each button scrolls by one visible page and is disabled at its end of the list;
 * both are hidden when everything already fits.
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
    "size-12 place-items-center rounded-full border-[1.5px] border-accent text-accent-ink transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-on-accent active:scale-95 disabled:pointer-events-none disabled:opacity-30";
  const fits = edges.start && edges.end;

  // The mouse drags the row like a finger swipes it; a drag must not also open the card it ends on.
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className={className}>
      <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
      <button type="button" className={cn(button, "hidden", !fits && "lg:grid")} onClick={() => page(-1)} disabled={edges.start} aria-label={prevLabel} aria-controls={listId}>
        <ArrowLeft className="size-5" aria-hidden />
      </button>
      <ul
        ref={ref}
        id={listId}
        aria-label={label}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const el = ref.current;
          if (!d || !el) return;
          const dx = e.clientX - d.x;
          if (!d.moved && Math.abs(dx) > 5) {
            d.moved = true;
            setDragging(true);
            el.setPointerCapture(e.pointerId);
          }
          if (d.moved) el.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => drag.current?.moved && setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
          drag.current = null;
        }}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          dragging ? "cursor-grabbing select-none snap-none" : "cursor-grab",
          "no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto overscroll-x-contain px-[var(--gutter)] sm:gap-5",
          // The list scrolls, so it clips whatever sticks out of it: padding gives the cards' shadows room
          // (below and at the sides), and the matching negative margins keep the layout where it was.
          "-mt-3 -mb-8 pt-3 pb-10",
          // Phones: one card and a clear peek of the next; tablets: two and a peek; desktop: three,
          // four from `xl` (narrower cards would squeeze names and prices).
          "[&>li]:flex [&>li]:w-[min(74vw,18.5rem)] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-2.5rem)/2.3)] lg:[&>li]:w-[calc((100%-2.5rem)/3)] xl:[&>li]:w-[calc((100%-3.75rem)/4)]",
          "lg:-mx-2 lg:scroll-px-2 lg:px-2",
        )}
      >
        {children}
      </ul>
      <button type="button" className={cn(button, "hidden", !fits && "lg:grid")} onClick={() => page(1)} disabled={edges.end} aria-label={nextLabel} aria-controls={listId}>
        <ArrowRight className="size-5" aria-hidden />
      </button>
      </div>
      {/* Phones: the buttons on their own line above the footer, which then takes the full width. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-5 sm:mt-8">
        <div className="order-2 w-full sm:order-1 sm:w-auto">{footer}</div>
        <div className={cn("order-1 ml-auto flex shrink-0 gap-2 sm:order-2 lg:hidden", fits && "hidden")}>
          <button type="button" className={cn(button, "grid")} onClick={() => page(-1)} disabled={edges.start} aria-label={prevLabel} aria-controls={listId}>
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button type="button" className={cn(button, "grid")} onClick={() => page(1)} disabled={edges.end} aria-label={nextLabel} aria-controls={listId}>
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
