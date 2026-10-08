"use client";

import { Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Smash", "Pizza", "Aripioare", "Cartofi", "Bacon", "Milkshake"];

export function SearchDialog({ triggerClassName }: { triggerClassName?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={cn(
          "grid size-11 place-items-center rounded-xl text-ink transition-colors hover:bg-sand",
          triggerClassName,
        )}
        aria-label="Caută în meniu"
        aria-haspopup="dialog"
      >
        <Search className="size-5" aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-label="Caută în meniu"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="sheet mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-ivory p-0 shadow-[var(--shadow-lift)]"
      >
        <Form action="/menu" onSubmit={close} className="p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            <Search className="size-5 shrink-0 text-muted" aria-hidden />
            <input
              name="q"
              type="search"
              autoFocus
              required
              placeholder="Burger, pizza, cartofi…"
              aria-label="Termen de căutare"
              className="h-13 w-full bg-transparent text-base outline-none placeholder:text-muted/70 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={close}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-sand"
              aria-label="Închide căutarea"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-4 mb-2 text-xs font-bold tracking-wider text-muted uppercase">Căutări populare</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/menu?q=${encodeURIComponent(s)}`}
                onClick={close}
                className="rounded-full bg-sand px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:bg-oat"
              >
                {s}
              </Link>
            ))}
          </div>
        </Form>
      </dialog>
    </>
  );
}
