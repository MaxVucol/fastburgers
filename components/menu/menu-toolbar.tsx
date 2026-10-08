"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  MENU_FILTERS,
  MENU_SORTS,
  menuQueryToSearch,
  type MenuFilter,
  type MenuQuery,
  type MenuSort,
} from "@/lib/menu-query";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/catalog";

export function MenuToolbar({
  query,
  categories,
}: {
  query: MenuQuery;
  categories: CategorySummary[];
}) {
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

  function navigate(next: Partial<MenuQuery>) {
    const search = menuQueryToSearch({ ...query, ...next });
    startTransition(() => {
      router.replace(`/menu${search}`, { scroll: false });
    });
  }

  // Debounced live search.
  useEffect(() => {
    const value = text.trim();
    if (value === lastSent.trim()) return;
    const t = window.setTimeout(() => {
      setLastSent(value);
      const search = menuQueryToSearch({ ...query, q: value });
      startTransition(() => router.replace(`/menu${search}`, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(t);
  }, [text, lastSent, query, router]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
      active ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-sand",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setLastSent(text.trim());
            navigate({ q: text.trim() });
          }}
        >
          <label htmlFor="menu-search" className="sr-only">
            Caută după nume, ingrediente sau categorie
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="menu-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Caută: smash, bacon, picant, cheesecake…"
            className="h-12 w-full rounded-xl border border-line bg-white pr-11 pl-11 text-[0.9375rem] placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {isPending ? (
            <Loader2 className="absolute top-1/2 right-3.5 size-5 -translate-y-1/2 animate-spin text-muted" aria-label="Se încarcă" />
          ) : text ? (
            <button
              type="button"
              onClick={() => {
                setText("");
                setLastSent("");
                navigate({ q: "" });
              }}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-sand"
              aria-label="Șterge căutarea"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </form>

        <label className="flex items-center gap-2 sm:w-56">
          <span className="sr-only">Sortează produsele</span>
          <select
            value={query.sort}
            onChange={(e) => navigate({ sort: e.target.value as MenuSort })}
            className="h-12 w-full cursor-pointer rounded-xl border border-line bg-white px-3.5 text-[0.9375rem] font-medium focus:border-accent focus:outline-none"
          >
            {MENU_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sortare: {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:flex-wrap sm:px-0">
        {MENU_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={query.filter === f.value}
            onClick={() => navigate({ filter: f.value as MenuFilter })}
            className={chip(query.filter === f.value)}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 w-px shrink-0 self-stretch bg-line" aria-hidden />
        <button
          type="button"
          aria-pressed={!query.category}
          onClick={() => navigate({ category: "" })}
          className={chip(!query.category)}
        >
          Toate categoriile
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={query.category === c.slug}
            onClick={() => navigate({ category: query.category === c.slug ? "" : c.slug })}
            className={chip(query.category === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
