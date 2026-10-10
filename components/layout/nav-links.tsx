"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { splitLocale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Compares locale-independent paths, so "/ru/menu" is active for the "/menu" item. */
export function isActivePath(pathname: string, href: string) {
  const path = splitLocale(pathname).path;
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/**
 * Runs `usePathname()` behind a Suspense boundary: on dynamic routes the pathname is
 * request data, so the static shell renders the fallback (same UI, nothing highlighted).
 */
export function WithPathname({ children }: { children: (pathname: string) => React.ReactNode }) {
  return (
    <Suspense fallback={children("")}>
      <PathnameReader>{children}</PathnameReader>
    </Suspense>
  );
}

function PathnameReader({ children }: { children: (pathname: string) => React.ReactNode }) {
  const pathname = usePathname();
  return children(pathname);
}

function NavLinksView({ pathname }: { pathname: string }) {
  const { t, href } = useI18n();
  return (
    <ul className="flex items-center gap-1 xl:gap-3">
      {siteConfig.nav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={href(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center px-3 text-[0.9375rem] font-medium transition-colors duration-[var(--duration-fast)]",
                "after:absolute after:inset-x-3 after:bottom-1 after:h-[2px] after:origin-left after:bg-accent after:transition-transform after:duration-[var(--duration-base)]",
                active
                  ? "text-accent-ink after:scale-x-100"
                  : "text-ink after:scale-x-0 hover:after:scale-x-100",
              )}
            >
              {t.nav[item.key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks() {
  return <WithPathname>{(pathname) => <NavLinksView pathname={pathname} />}</WithPathname>;
}
