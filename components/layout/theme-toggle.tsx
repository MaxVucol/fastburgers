"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { preferredTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const isDarkNow = () => document.documentElement.getAttribute("data-theme") === "dark";

/**
 * Light / Dark Premium switch for the header (on the always-dark bar). A toggle button with a
 * fixed name ("Dark theme") and `aria-pressed`; the icon shows the theme it switches to and is
 * chosen by CSS, so it is right before hydration too. The change cross-fades where the browser
 * supports view transitions (skipped with reduced motion) and is saved for later visits.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  // Pages rendered on the client from an error shell (404) never run the inline <head> script.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-theme")) root.setAttribute("data-theme", preferredTheme());
  }, []);

  function toggle() {
    const next: Theme = isDarkNow() ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode): the switch still works for this page.
    }
    const apply = () => document.documentElement.setAttribute("data-theme", next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && typeof document.startViewTransition === "function") document.startViewTransition(apply);
    else apply();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={t.header.darkTheme}
      title={t.header.darkTheme}
      className={cn(
        "grid size-11 place-items-center rounded-full text-on-dark transition-colors duration-[var(--duration-base)] hover:bg-graphite-soft",
        className,
      )}
    >
      <Moon className="size-5 dark:hidden" aria-hidden strokeWidth={1.8} />
      <Sun className="hidden size-5 dark:block" aria-hidden strokeWidth={1.8} />
    </button>
  );
}
