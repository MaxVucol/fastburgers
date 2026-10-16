"use client";

import { splitLocale } from "@/lib/i18n/config";
import { WithPathname } from "./nav-links";

/** True on the menu, a category and a product page: where "Order now" (which leads to the menu) has nothing to add. */
function onMenu(pathname: string) {
  const { path } = splitLocale(pathname);
  return path === "/menu" || path.startsWith("/menu/") || path.startsWith("/categorii");
}

/** Shows its content everywhere except while the visitor is already browsing the menu. */
export function HideOnMenu({ children }: { children: React.ReactNode }) {
  return <WithPathname>{(pathname) => (onMenu(pathname) ? null : children)}</WithPathname>;
}
