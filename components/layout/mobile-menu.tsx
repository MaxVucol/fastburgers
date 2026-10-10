"use client";

import Link from "next/link";
import Form from "next/form";
import { ArrowRight, Clock, Menu, PackageSearch, Phone, Search, X } from "lucide-react";
import { useRef } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { isActivePath, WithPathname } from "./nav-links";

export function MobileMenu() {
  const { t, href } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-sand lg:hidden"
        aria-label={t.header.openMenu}
        aria-haspopup="dialog"
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <dialog
        ref={ref}
        aria-label={t.header.navigation}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="drawer-left fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-dvh w-full max-w-md bg-ink p-0 text-on-dark"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line-dark px-5">
            <Logo href={href("/")} label={t.header.homeLink} tone="dark" onClick={close} />
            <button
              type="button"
              onClick={close}
              className="grid size-11 place-items-center rounded-full hover:bg-graphite-soft"
              aria-label={t.header.closeMenu}
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <Form action={href("/menu")} onSubmit={close}>
              <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border-[1.5px] border-line-dark px-3.5 focus-within:border-on-dark">
                <Search className="size-5 text-muted-on-dark" aria-hidden />
                <span className="sr-only">{t.search.label}</span>
                <input
                  name="q"
                  type="search"
                  required
                  placeholder={t.search.placeholder}
                  className="h-12 w-full bg-transparent text-on-dark outline-none placeholder:text-muted-on-dark focus-visible:outline-none"
                />
              </label>
            </Form>

            <nav aria-label={t.nav.main} className="mt-6">
              <ul className="divide-y divide-line-dark border-y border-line-dark">
                <WithPathname>
                  {(pathname) =>
                    siteConfig.nav.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={href(item.href)}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-between py-4 font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] transition-colors",
                              active ? "text-flame" : "text-on-dark hover:text-flame",
                            )}
                          >
                            {t.nav[item.key]}
                            <ArrowRight className="size-5 opacity-60" aria-hidden />
                          </Link>
                        </li>
                      );
                    })
                  }
                </WithPathname>
              </ul>
            </nav>

            <Link
              href={href("/account")}
              onClick={close}
              className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-on-dark hover:text-flame"
            >
              <PackageSearch className="size-5" aria-hidden /> {t.nav.track}
            </Link>

            <Link
              href={href("/menu")}
              onClick={close}
              className="mt-7 flex h-13 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-ink hover:bg-accent-hover"
            >
              {t.common.orderNow}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="flex items-end justify-between gap-4 border-t border-line-dark px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm">
            <div className="space-y-1.5">
              <a href={siteConfig.phoneHref} className="flex items-center gap-2 font-semibold hover:text-flame">
                <Phone className="size-4 text-flame" aria-hidden /> {siteConfig.phone}
              </a>
              <p className="flex items-center gap-2 text-muted-on-dark">
                <Clock className="size-4" aria-hidden /> {t.header.open}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </dialog>
    </>
  );
}
