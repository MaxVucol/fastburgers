"use client";

import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { DEFAULT_MENU_QUERY, MENU_SORTS, type MenuFilter, type MenuQuery, type MenuSort } from "@/lib/menu-query";
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
  // Phones: the filters and the sorting sit behind a button; from `sm` up they are always shown.
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = (query.q ? 1 : 0) + (query.filter !== DEFAULT_MENU_QUERY.filter ? 1 : 0) + (query.sort !== DEFAULT_MENU_QUERY.sort ? 1 : 0);
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
        <div className="flex flex-col gap-3 md:max-w-sm md:flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            "relative flex h-11 w-full items-center justify-center gap-2 rounded-full border-[1.5px] px-4 text-[0.9375rem] font-semibold transition-colors sm:hidden",
            open ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink/30",
          )}
        >
          <SlidersHorizontal className="size-[1.125rem]" aria-hidden />
          {t.menu.filtersButton}
          {active > 0 && (
            <span className="absolute -top-1.5 -right-1 grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-on-accent" aria-hidden>
              {active}
            </span>
          )}
        </button>
        <form role="search" className={cn("relative min-w-0", !open && "max-sm:hidden")} onSubmit={(e) => e.preventDefault()}>
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
        </div>

        <div id={panelId} className={cn("flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center md:ml-auto", !open && "max-sm:hidden")}>
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

          <SortSelect
            label={t.menu.sortLabel}
            value={query.sort}
            options={MENU_SORTS.map((value) => ({ value, label: t.menu.sorts[value] }))}
            onChange={(sort) => onChange({ sort })}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The sorting menu: a pill like the filter group that opens a rounded card with the options (the
 * browser's own list could not be styled). Keyboard: arrows, Home/End, Enter or Space to choose,
 * Escape to close; a press outside closes it.
 */
function SortSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: MenuSort;
  options: { value: MenuSort; label: string }[];
  onChange: (value: MenuSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function show() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }
  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  }
  function onKeyDown(event: React.KeyboardEvent) {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) return show();
        setActive((i) => (event.key === "ArrowDown" ? Math.min(last, i + 1) : Math.max(0, i - 1)));
        break;
      }
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(active);
        else show();
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0 self-start min-[480px]:self-auto" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border-[1.5px] bg-transparent pr-3 pl-4 text-sm font-semibold transition-colors duration-[var(--duration-fast)] focus-visible:border-ink focus-visible:outline-none",
          open ? "border-ink" : "border-line hover:border-ink/30",
        )}
      >
        {current.label}
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="animate-fade-in absolute top-full right-0 z-40 mt-2 w-max min-w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper p-1.5 shadow-[var(--shadow-lift)] max-[479px]:left-0"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-6 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-100",
                  index === active ? "bg-sand" : "",
                  selected ? "font-bold text-ink" : "font-medium text-ink-soft",
                )}
              >
                {option.label}
                {selected && <Check className="size-4 text-accent-ink" aria-hidden strokeWidth={2.6} />}
              </li>
            );
          })}
        </ul>
      )}
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
