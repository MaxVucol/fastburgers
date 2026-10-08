"use client";

import Link from "next/link";
import Form from "next/form";
import { Clock, Menu, Phone, Search, User, X } from "lucide-react";
import { useRef } from "react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActivePath, WithPathname } from "./nav-links";

export function MobileMenu() {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand md:hidden"
        aria-label="Deschide meniul de navigare"
        aria-haspopup="dialog"
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-label="Navigare"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(22rem,100%)] bg-ivory p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Logo onClick={close} />
            <button
              type="button"
              onClick={close}
              className="grid size-11 place-items-center rounded-xl hover:bg-sand"
              aria-label="Închide meniul"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <Form action="/menu" onSubmit={close} className="px-4 pt-4">
            <label className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 focus-within:border-accent">
              <Search className="size-5 text-muted" aria-hidden />
              <span className="sr-only">Caută în meniu</span>
              <input
                name="q"
                type="search"
                required
                placeholder="Caută în meniu…"
                className="h-12 w-full bg-transparent outline-none focus-visible:outline-none"
              />
            </label>
          </Form>

          <nav aria-label="Principală" className="flex-1 overflow-y-auto px-2 py-3">
            <ul>
              <WithPathname>
                {(pathname) =>
                  siteConfig.nav.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center rounded-xl px-3 py-3.5 font-display text-xl font-bold",
                            active ? "bg-sand text-ink" : "text-ink-soft hover:bg-sand",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })
                }
              </WithPathname>
              <li>
                <Link
                  href="/account"
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl px-3 py-3.5 font-display text-xl font-bold text-ink-soft hover:bg-sand"
                >
                  <User className="size-5" aria-hidden /> Contul meu
                </Link>
              </li>
            </ul>
          </nav>

          <div className="space-y-2 border-t border-line px-5 py-4 text-sm text-muted">
            <a href={siteConfig.phoneHref} className="flex items-center gap-2 font-semibold text-ink">
              <Phone className="size-4 text-accent" aria-hidden /> {siteConfig.phone}
            </a>
            <p className="flex items-center gap-2">
              <Clock className="size-4" aria-hidden /> Deschis zilnic de la 11:00
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
