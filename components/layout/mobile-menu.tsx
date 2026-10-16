"use client";

import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { ArrowRight, CircleUserRound, Clock, Menu, PackageSearch, Phone, Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import categoryIcons from "@/lib/category-icons.json";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { headerIconButton } from "./header-icon";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { isActivePath, WithPathname } from "./nav-links";

const icons: Record<string, { src: string; width: number }> = categoryIcons;

/**
 * The phone menu. "Menu" is a link to the menu page; the arrow beside it opens the list of categories
 * right under it (and closes it again).
 */
export function MobileMenu({ categories }: { categories: { slug: string; name: string }[] }) {
  const { t, href } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesId = useId();

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          ref.current?.showModal();
          // Opened by a tap or click: the dialog's first link must not show a keyboard focus ring.
          if (e.detail > 0) (document.activeElement as HTMLElement | null)?.blur();
        }}
        className={cn(headerIconButton, "lg:hidden")}
        aria-label={t.header.openMenu}
        aria-haspopup="dialog"
      >
        <Menu className="size-6" aria-hidden strokeWidth={1.75} />
      </button>
      <dialog
        ref={ref}
        aria-label={t.header.navigation}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="drawer-left fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-dvh w-full max-w-md bg-graphite p-0 text-on-dark"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line-dark px-5">
            <Logo href={href("/")} label={t.header.homeLink} tone="dark" size="lg" sparkle onClick={close} />
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
                      const linkClass = cn(
                        "flex items-center justify-between py-4 font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] transition-colors",
                        active ? "text-flame" : "text-on-dark hover:text-flame",
                      );
                      if (item.href === "/menu") {
                        return (
                          <li key={item.href}>
                            <div className="flex items-stretch">
                              <Link href={href(item.href)} onClick={close} aria-current={active ? "page" : undefined} className={cn(linkClass, "flex-1")}>
                                {t.nav[item.key]}
                              </Link>
                              <button
                                type="button"
                                onClick={() => setCategoriesOpen((v) => !v)}
                                aria-expanded={categoriesOpen}
                                aria-controls={categoriesId}
                                aria-label={t.menu.categoriesLabel}
                                className="-mr-2 grid w-14 place-items-center text-on-dark opacity-70 transition-opacity hover:opacity-100"
                              >
                                <ArrowRight className={cn("size-5 transition-transform duration-300", categoriesOpen && "rotate-90")} aria-hidden />
                              </button>
                            </div>
                            <div
                              id={categoriesId}
                              inert={!categoriesOpen}
                              className={cn(
                                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                                categoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                              )}
                            >
                              <ul className="min-h-0 overflow-hidden">
                                {[{ slug: "", name: t.menu.allCategories }, ...categories].map((c) => {
                                  const icon = icons[c.slug || "all"];
                                  return (
                                    <li key={c.slug || "all"}>
                                      <Link
                                        href={href(c.slug ? `/categorii/${c.slug}` : "/menu")}
                                        onClick={close}
                                        className="flex items-center gap-4 py-2.5 pl-1 text-lg font-semibold text-on-dark/90 transition-colors hover:text-flame"
                                      >
                                        <span className="grid h-11 w-14 shrink-0 place-items-center">
                                          {icon && <Image src={icon.src} alt="" width={icon.width} height={144} sizes="64px" className="max-h-11 w-auto object-contain" />}
                                        </span>
                                        {c.name}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </li>
                        );
                      }
                      return (
                        <li key={item.href}>
                          <Link href={href(item.href)} onClick={close} aria-current={active ? "page" : undefined} className={linkClass}>
                            {t.nav[item.key]}
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
              className="mt-5 flex min-h-11 items-center gap-2.5 text-sm font-semibold text-on-dark hover:text-flame"
            >
              <CircleUserRound className="size-5" aria-hidden /> {t.me.link}
            </Link>
            <Link
              href={href("/account")}
              onClick={close}
              className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-on-dark hover:text-flame"
            >
              <PackageSearch className="size-5" aria-hidden /> {t.nav.track}
            </Link>

            <Link
              href={href("/menu")}
              onClick={close}
              className="mt-7 flex h-13 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-on-accent hover:bg-accent-hover"
            >
              {t.common.orderNow}
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
