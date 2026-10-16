"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MENU_SORTS, type MenuFilter, type MenuQuery, type MenuSort } from "@/lib/menu-query";
import { cn } from "@/lib/utils";

/**
 * Search, filters and sorting. Fully controlled: every press goes straight to `onChange`, and the
 * list is filtered in the browser (see MenuExplorer), so nothing waits for the server.
 */
export function MenuToolbar({
  query,
  filters,
  onChange,
}: {
  query: MenuQuery;
  /** The filters offered (those with something to show). With only "all" left, none are shown. */
  filters: readonly MenuFilter[];
  onChange: (next: Partial<MenuQuery>) => void;
}) {
  const { t } = useI18n();
  const groupRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pillPlaced = useRef(false);

  // The orange pill glides to the chosen filter (instead of each button lighting up on its own).
  function placePill(animate: boolean) {
    const group = groupRef.current;
    const pill = pillRef.current;
    const active = group?.querySelector<HTMLElement>("button[aria-pressed=true]");
    if (!group || !pill || !active) return;
    pill.style.transition = animate ? "" : "none";
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    if (!animate) void pill.offsetWidth; // apply the jump before transitions come back
  }
  useLayoutEffect(() => {
    placePill(pillPlaced.current);
    if (!pillPlaced.current && groupRef.current) {
      pillPlaced.current = true;
      // From now on the pill carries the colour (CSS keyed on this attribute, no re-render needed).
      groupRef.current.dataset.pill = "";
    }
  }, [query.filter, filters]);
  // A new width of the group (window resize, font load) moves the pill without animating. The
  // first callback only reports the initial size, and this observer is not rebuilt per filter:
  // otherwise it would snap the pill into place and cancel the glide.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    let initial = true;
    const observer = new ResizeObserver(() => {
      if (initial) initial = false;
      else placePill(false);
    });
    observer.observe(group);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
        <form role="search" className="relative md:max-w-sm md:flex-1" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="menu-search" className="sr-only">
            {t.menu.searchLabel}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="menu-search"
            type="search"
            value={query.q}
            onChange={(e) => onChange({ q: e.target.value.slice(0, 80) })}
            placeholder={t.menu.searchPlaceholder}
            className="h-11 w-full rounded-full border-[1.5px] border-line bg-paper pr-11 pl-11 text-[0.9375rem] placeholder:text-muted/75 hover:border-ink/30 focus:border-ink focus:ring-4 focus:ring-accent/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query.q && (
            <button
              type="button"
              onClick={() => onChange({ q: "" })}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
              aria-label={t.menu.clearSearch}
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </form>

        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center md:ml-auto">
          {filters.length > 1 && (
          <div
            ref={groupRef}
            role="group"
            aria-label={t.menu.filtersLabel}
            className="no-scrollbar relative flex min-w-0 flex-1 overflow-x-auto rounded-full border-[1.5px] border-line p-0.5 md:flex-none [&>button]:flex-1 md:[&>button]:flex-none"
          >
            <span
              ref={pillRef}
              aria-hidden
              className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-full bg-accent opacity-0 transition-[transform,width] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [[data-pill]_&]:opacity-100"
            />
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={query.filter === f}
                onClick={() => onChange({ filter: f })}
                className={cn(
                  "relative z-10 h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                  query.filter === f ? "text-on-accent" : "text-ink-soft hover:text-ink",
                  // Until the pill has been measured (first paint) the chosen button carries the colour itself.
                  query.filter === f && "bg-accent [[data-pill]_&]:bg-transparent",
                )}
              >
                {t.menu.filters[f]}
              </button>
            ))}
          </div>
          )}

          <label className="relative shrink-0 self-start min-[480px]:self-auto">
            <span className="sr-only">{t.menu.sortLabel}</span>
            <select
              value={query.sort}
              onChange={(e) => onChange({ sort: e.target.value as MenuSort })}
              className="h-10 cursor-pointer appearance-none rounded-full border-[1.5px] border-line bg-transparent pr-9 pl-4 text-sm font-semibold hover:border-ink/30 focus:border-ink focus:outline-none"
            >
              {MENU_SORTS.map((s) => (
                <option key={s} value={s}>
                  {t.menu.sorts[s]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden />
          </label>
        </div>
      </div>
    </div>
  );
}

/** The toolbar in its bar: full width, under the header, and it stays on screen while the list scrolls. */
export function MenuToolbarBar(props: { query: MenuQuery; filters: readonly MenuFilter[]; onChange: (next: Partial<MenuQuery>) => void }) {
  return (
    <div className="z-30 border-b border-line bg-cream/95 backdrop-blur-md sm:sticky sm:top-[var(--header-h)]">
      <div className="container-page">
        <MenuToolbar {...props} />
      </div>
    </div>
  );
}
