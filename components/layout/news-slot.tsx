"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { splitLocale } from "@/lib/i18n/config";

/**
 * Whether the footer shows its "what's new" line on a page: not in the menu (its own New /
 * On offer filters sit right above) nor in the order flow (checkout, order status, account),
 * where it would only pull people away.
 */
export function showsNews(pathname: string): boolean {
  const path = splitLocale(pathname).path;
  return !(path === "/menu" || /^\/(checkout|order|account)(\/|$)/.test(path));
}

/** Renders the server-rendered line where it belongs (shown while the path is unknown). */
export function NewsSlot({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <Pick>{children}</Pick>
    </Suspense>
  );
}

function Pick({ children }: { children: ReactNode }) {
  return showsNews(usePathname()) ? children : null;
}
