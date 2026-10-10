"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { splitLocale } from "@/lib/i18n/config";

/**
 * Which "what's new" band the footer shows on a page:
 *  - full: the home page, where it closes the page as a brand moment;
 *  - none: the menu (its own New / On offer filters sit right above) and the order flow
 *    (checkout, order status, account), where it would only pull people away;
 *  - compact: every other page — one line with the same two links.
 */
export function newsVariant(pathname: string): "full" | "compact" | "none" {
  const path = splitLocale(pathname).path;
  if (path === "/") return "full";
  if (path === "/menu" || /^\/(checkout|order|account)(\/|$)/.test(path)) return "none";
  return "compact";
}

/** Picks the server-rendered variant for the current path (compact while the path is unknown). */
export function NewsSlot({ full, compact }: { full: ReactNode; compact: ReactNode }) {
  return (
    <Suspense fallback={compact}>
      <PickVariant full={full} compact={compact} />
    </Suspense>
  );
}

function PickVariant({ full, compact }: { full: ReactNode; compact: ReactNode }) {
  const variant = newsVariant(usePathname());
  return variant === "full" ? full : variant === "compact" ? compact : null;
}
