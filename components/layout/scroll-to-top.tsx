"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

/** Set by a click on a link to another page; the page that follows scrolls to the top. */
let scrollOnArrival = false;

const top = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });

function PathWatcher() {
  const pathname = usePathname();
  useEffect(() => {
    if (!scrollOnArrival) return;
    scrollOnArrival = false;
    top();
  }, [pathname]);
  return null;
}

/**
 * Following a link on the site (navigation, categories, logo, cards) always lands at the very top
 * of the page, also when the page is only partly different (the header stays) or the same page is
 * opened again. Not for language links (they keep the position), new tabs, modified clicks or
 * in-page anchors; the browser's back and forward buttons keep restoring where you were.
 */
export function ScrollToTopOnNavigate() {
  useEffect(() => {
    // Capture phase: Next's <Link> calls preventDefault() while handling the click, so by the time a
    // bubbling listener runs the click looks "handled". Here it still looks like a plain link click.
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || link.hasAttribute("hreflang")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.hash) return;
      if (url.pathname === location.pathname) top();
      else scrollOnArrival = true;
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // usePathname reads request data, so it sits in its own Suspense and the static shell is unaffected.
  return (
    <Suspense fallback={null}>
      <PathWatcher />
    </Suspense>
  );
}
