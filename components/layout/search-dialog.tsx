"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function SearchDialog({ triggerClassName }: { triggerClassName?: string }) {
  const { t, href } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={cn(
          "grid size-11 place-items-center rounded-full text-ink transition-colors duration-[var(--duration-fast)] hover:bg-sand",
          triggerClassName,
        )}
        aria-label={t.search.label}
        aria-haspopup="dialog"
      >
        <Search className="size-5" aria-hidden strokeWidth={1.9} />
      </button>
      <dialog
        ref={ref}
        aria-label={t.search.label}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="sheet mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-2xl rounded-[var(--radius-panel)] bg-cream p-0 shadow-[var(--shadow-lift)]"
      >
        <Form action={href("/menu")} onSubmit={close} className="p-5 sm:p-7">
          <div className="flex items-center gap-3 border-b-2 border-ink pb-2">
            <Search className="size-6 shrink-0 text-ink" aria-hidden />
            <input
              name="q"
              type="search"
              autoFocus
              required
              placeholder={t.search.placeholder}
              aria-label={t.search.term}
              className="h-14 w-full bg-transparent font-display text-2xl font-medium outline-none placeholder:text-muted/60 focus-visible:outline-none sm:text-3xl [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={close}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
              aria-label={t.search.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <p className="type-eyebrow mt-6 mb-3 text-muted">{t.search.popular}</p>
          <ul className="flex flex-wrap gap-2">
            {t.search.suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={href(`/menu?q=${encodeURIComponent(s)}`)}
                  onClick={close}
                  className="group inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-sand px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-on-dark"
                >
                  {s}
                  <ArrowUpRight className="size-3.5 opacity-50 group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Form>
      </dialog>
    </>
  );
}
