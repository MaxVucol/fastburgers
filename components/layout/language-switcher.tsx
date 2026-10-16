"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { LOCALE_COOKIE, localeNames, locales, localizePath, splitLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { WithPathname } from "./nav-links";

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * The three languages with the link to the same page in each, and the click handler that switches
 * (shared by the language bar and the language items of the header's category row).
 */
export function useLocaleLinks(pathname: string) {
  const { locale } = useI18n();
  const router = useRouter();
  const path = splitLocale(pathname || "/").path;
  return locales.map((l) => {
    const target = localizePath(l, path);
    return {
      locale: l,
      href: target,
      active: l === locale,
      onClick(event: React.MouseEvent<HTMLAnchorElement>) {
        // The cookie is written before navigating, so proxy.ts already sees the new choice. Plain
        // <a> (no prefetch) avoids requests made under the old cookie. The query string (menu
        // filters) and hash are kept.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        remember(l);
        if (l === locale) return;
        // Same page in another language: stay where the reader is instead of scrolling to the top.
        router.push(`${target}${window.location.search}${window.location.hash}`, { scroll: false });
      },
    };
  });
}

function Switcher({ pathname, tone }: { pathname: string; tone: "light" | "dark" }) {
  const { t } = useI18n();
  const links = useLocaleLinks(pathname);

  return (
    <nav aria-label={t.topbar.language}>
      <ul className="flex items-center">
        {links.map(({ locale: l, href: target, active, onClick }) => {
          return (
            <li key={l} className="flex items-center">
              <a
                href={target}
                hrefLang={l}
                lang={l}
                aria-current={active ? "true" : undefined}
                title={localeNames[l].native}
                onClick={onClick}
                className={cn(
                  "relative grid h-8 min-w-8 place-items-center px-1 text-xs font-bold xl:min-w-9 xl:text-[0.8125rem] tracking-[0.12em] transition-colors duration-[var(--duration-fast)]",
                  // Dark bar: the current language is plain cream with a thin cream rule; orange stays
                  // reserved for the active page in the main navigation next to it.
                  tone === "dark"
                    ? active
                      ? "text-on-dark"
                      : "text-muted-on-dark hover:text-on-dark"
                    : active
                      ? "text-ink"
                      : "text-muted hover:text-ink",
                )}
              >
                <span className="sr-only">{localeNames[l].native}</span>
                <span aria-hidden>{localeNames[l].short}</span>
                {active && (
                  <span
                    className={cn("absolute inset-x-2 bottom-0.5 h-[2px] rounded-full", tone === "dark" ? "bg-on-dark/70" : "bg-accent")}
                    aria-hidden
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LanguageSwitcher({ tone = "dark" }: { tone?: "light" | "dark" }) {
  return <WithPathname>{(pathname) => <Switcher pathname={pathname} tone={tone} />}</WithPathname>;
}
