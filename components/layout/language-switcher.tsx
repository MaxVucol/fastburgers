"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { LOCALE_COOKIE, localeNames, locales, localizePath, splitLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { WithPathname } from "./nav-links";

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Switcher({ pathname, tone }: { pathname: string; tone: "light" | "dark" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const path = splitLocale(pathname || "/").path;

  return (
    <nav aria-label={t.topbar.language}>
      <ul className="flex items-center">
        {locales.map((l) => {
          const active = l === locale;
          const target = localizePath(l, path);
          return (
            <li key={l} className="flex items-center">
              <a
                href={target}
                hrefLang={l}
                lang={l}
                aria-current={active ? "true" : undefined}
                title={localeNames[l].native}
                onClick={(event) => {
                  // The cookie is written before navigating, so proxy.ts already sees the new
                  // choice. Plain <a> (no prefetch) avoids requests made under the old cookie.
                  // The query string (menu filters) and hash are kept.
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  remember(l);
                  if (active) return;
                  router.push(`${target}${window.location.search}${window.location.hash}`);
                }}
                className={cn(
                  "relative grid h-8 min-w-9 place-items-center px-1.5 text-xs font-bold tracking-[0.12em] transition-colors duration-[var(--duration-fast)]",
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
                {active && <span className="absolute inset-x-2 bottom-1 h-[2px] bg-accent" aria-hidden />}
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
