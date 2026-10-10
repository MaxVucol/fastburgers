"use client";

import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MENU_FILTERS, MENU_SORTS, menuQueryToSearch, type MenuQuery, type MenuSort } from "@/lib/menu-query";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/catalog";

export function MenuToolbar({
  query,
  categories,
}: {
  query: MenuQuery;
  categories: CategorySummary[];
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const [lastSent, setLastSent] = useState(query.q);
  const [prevQ, setPrevQ] = useState(query.q);

  // Sync the input when the URL changes from elsewhere (e.g. the header search).
  if (query.q !== prevQ) {
    setPrevQ(query.q);
    if (query.q !== lastSent) {
      setText(query.q);
      setLastSent(query.q);
    }
  }

  const menuPath = href("/menu");

  function navigate(next: Partial<MenuQuery>) {
    const search = menuQueryToSearch({ ...query, ...next });
    startTransition(() => {
      router.replace(`${menuPath}${search}`, { scroll: false });
    });
  }

  // Debounced live search.
  useEffect(() => {
    const value = text.trim();
    if (value === lastSent.trim()) return;
    const timer = window.setTimeout(() => {
      setLastSent(value);
      const search = menuQueryToSearch({ ...query, q: value });
      startTransition(() => router.replace(`${menuPath}${search}`, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [text, lastSent, query, router, menuPath]);

  const tab = (active: boolean) =>
    cn(
      "relative inline-flex h-12 shrink-0 items-center px-1 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-[var(--duration-fast)]",
      "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-accent after:transition-transform after:duration-[var(--duration-base)]",
      active ? "text-ink after:scale-x-100" : "text-muted after:scale-x-0 hover:text-ink",
    );

  return (
    <div>
      <nav aria-label={t.menu.categoriesLabel} className="border-b border-line">
        <div className="no-scrollbar -mx-[var(--gutter)] flex gap-6 overflow-x-auto px-[var(--gutter)] sm:gap-7">
          <button type="button" aria-pressed={!query.category} onClick={() => navigate({ category: "" })} className={tab(!query.category)}>
            {t.menu.allCategories}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={query.category === c.slug}
              onClick={() => navigate({ category: query.category === c.slug ? "" : c.slug })}
              className={tab(query.category === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
        <form
          role="search"
          className="relative md:max-w-sm md:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setLastSent(text.trim());
            navigate({ q: text.trim() });
          }}
        >
          <label htmlFor="menu-search" className="sr-only">
            {t.menu.searchLabel}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="menu-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.menu.searchPlaceholder}
            className="h-11 w-full rounded-full border-[1.5px] border-line bg-paper pr-11 pl-11 text-[0.9375rem] placeholder:text-muted/75 hover:border-ink/30 focus:border-ink focus:ring-4 focus:ring-accent/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {isPending ? (
            <Loader2 className="absolute top-1/2 right-4 size-[1.125rem] -translate-y-1/2 animate-spin text-muted" aria-label={t.common.loading} />
          ) : text ? (
            <button
              type="button"
              onClick={() => {
                setText("");
                setLastSent("");
                navigate({ q: "" });
              }}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
              aria-label={t.menu.clearSearch}
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </form>

        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center md:ml-auto">
          <div
            role="group"
            aria-label={t.menu.filtersLabel}
            className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto rounded-full border-[1.5px] border-line p-0.5 md:flex-none [&>button]:flex-1 md:[&>button]:flex-none"
          >
            {MENU_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={query.filter === f}
                onClick={() => navigate({ filter: f })}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-[var(--duration-fast)]",
                  query.filter === f ? "bg-ink text-on-dark" : "text-ink-soft hover:bg-sand",
                )}
              >
                {t.menu.filters[f]}
              </button>
            ))}
          </div>

          <label className="relative shrink-0 self-start min-[480px]:self-auto">
            <span className="sr-only">{t.menu.sortLabel}</span>
            <select
              value={query.sort}
              onChange={(e) => navigate({ sort: e.target.value as MenuSort })}
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
