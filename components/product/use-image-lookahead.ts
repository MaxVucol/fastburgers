import { useEffect, type RefObject } from "react";

/** How far ahead of the screen, in screen heights, the pictures of the cards below (and above) start loading. */
const AHEAD = "200% 0px";

/**
 * Starts loading the pictures of a card grid well before they scroll into view.
 *
 * The cards' pictures are `loading="lazy"`, so the browser decides when to fetch them, and it decides late:
 * Safari on iOS waits until a picture is almost on screen, and pictures inside a card that
 * `content-visibility: auto` still skips can wait even longer. On a long menu that shows as grey
 * cards while scrolling. Here every card is watched with a margin of two screens; once a card is that close
 * its pictures are switched to `eager`, so they are already there when it arrives.
 */
export function useImageLookahead(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const grid = ref.current;
    if (!grid || typeof IntersectionObserver === "undefined") return;
    const watched = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          for (const img of entry.target.querySelectorAll<HTMLImageElement>("img[loading=lazy]")) img.loading = "eager";
        }
      },
      { rootMargin: AHEAD },
    );
    const scan = () => {
      for (const card of grid.querySelectorAll(":scope > article")) {
        if (watched.has(card)) continue;
        watched.add(card);
        observer.observe(card);
      }
    };
    scan();
    // A new filter or search brings other cards into the same grid.
    const mutations = new MutationObserver(scan);
    mutations.observe(grid, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [ref]);
}
