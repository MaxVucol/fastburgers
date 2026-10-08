"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
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
  return (
    <ul className="flex items-center gap-1">
      {siteConfig.nav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3.5 py-2 text-[0.9375rem] font-semibold transition-colors",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
              {active && (
                <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-accent" aria-hidden />
              )}
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
