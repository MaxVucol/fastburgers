"use client";

import { useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { setAdminLocale } from "@/actions/admin/preferences";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { useDarkTheme } from "@/components/layout/theme-toggle";
import { localeNames, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Panel language (RO / RU / EN, saved in a cookie by a Server Action, the page re-renders) and the
 * light / dark theme switch (the same saved choice as on the site). Used in the panel's top bar and
 * on the sign-in page.
 */
export function AdminPreferences({ className }: { className?: string }) {
  const { locale, a } = useAdminI18n();
  const { dark, toggle } = useDarkTheme();
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div role="group" aria-label={a.shell.language} className={cn("flex rounded-full bg-sand p-0.5", pending && "opacity-60")}>
        {locales.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={active}
              title={localeNames[l].native}
              disabled={pending}
              onClick={() => {
                if (!active) startTransition(() => setAdminLocale(l));
              }}
              className={cn(
                "h-8 min-w-10 rounded-full px-2.5 text-xs font-bold tracking-[0.08em] transition-colors",
                active ? "bg-paper text-ink shadow-[var(--shadow-soft)] ring-1 ring-line" : "text-muted hover:text-ink",
              )}
            >
              <span className="sr-only">{localeNames[l].native}</span>
              <span aria-hidden>{localeNames[l].short}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={dark}
        aria-label={a.shell.darkTheme}
        title={a.shell.darkTheme}
        className="grid size-9 place-items-center rounded-full bg-sand text-ink-soft transition-colors hover:bg-oat hover:text-ink"
      >
        <Moon className="size-4.5 dark:hidden" aria-hidden strokeWidth={1.9} />
        <Sun className="hidden size-4.5 dark:block" aria-hidden strokeWidth={1.9} />
      </button>
    </div>
  );
}
