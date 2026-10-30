import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { windowRows, type GridWindow } from "@/lib/virtual-grid";

/** How far beyond the screen, in screen heights, cards stay in the page (and so have their pictures loading). */
const OVERSCAN_SCREENS = 1.5;
/** A grid with fewer cards is not worth windowing. */
export const VIRTUAL_MIN_ITEMS = 8;

type Measured = { signature: string; columns: number; width: number; gap: number; rowHeights: number[]; window: GridWindow };

/**
 * Keeps only the cards near the screen in the page, for a grid with hundreds of them.
 *
 * The server sends every card (the menu is a static page, and its links are plain HTML for search engines) and the
 * first client render matches it. Once mounted, the real height of every row is measured, and from then on the
 * grid renders just the rows around the screen, with padding standing in for the rest, so scrolling, filtering
 * and re-rendering touch a few dozen cards instead of the whole menu. A change of the list or of the number of columns
 * (rotating a phone) goes back to the full list for one frame to measure again, before anything is painted.
 *
 * Returns the slice of items to render, and the padding for the rows left out; `windowed` is false until measured.
 */
export function useVirtualGrid(ref: RefObject<HTMLElement | null>, count: number, signature: string, enabled: boolean) {
  const [measured, setMeasured] = useState<Measured | null>(null);
  const current = measured && measured.signature === signature && enabled ? measured : null;

  // 1. Measure: the full list is in the page (first render, or after a change); read every row's height, then window.
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid || !enabled || current) return;
    const cards = Array.from(grid.children) as HTMLElement[];
    // `content-visibility: auto` makes the cards far from the screen report a guessed height: show them for the measuring.
    for (const card of cards) card.style.contentVisibility = "visible";
    const style = getComputedStyle(grid);
    const columns = style.gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    const gap = parseFloat(style.rowGap) || 0;
    const rowHeights = rowHeightsOf(cards, columns);
    const width = grid.clientWidth;
    for (const card of cards) card.style.contentVisibility = "";
    if (cards.length !== count || rowHeights.length === 0) return;
    setMeasured({ signature, columns, width, gap, rowHeights, window: place(grid, rowHeights, gap, columns, count) });
  }, [ref, enabled, current, count, signature]);

  // 2. Follow the scroll; start over when the grid changes width.
  useEffect(() => {
    const grid = ref.current;
    if (!grid || !current) return;
    let frame = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      frame = 0;
      const next = place(grid, current.rowHeights, current.gap, current.columns, count);
      const old = current.window;
      if (next.start !== old.start || next.end !== old.end || next.padTop !== old.padTop || next.padBottom !== old.padBottom) {
        setMeasured({ ...current, window: next });
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (grid.clientWidth !== current.width) setMeasured(null);
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
    };
  }, [ref, current, count]);

  return current ? { windowed: true as const, ...current.window } : { windowed: false as const };
}

/** The height of each row: the tallest card in it (cards of a row stretch to the same height). */
function rowHeightsOf(cards: HTMLElement[], columns: number): number[] {
  const heights: number[] = [];
  for (let i = 0; i < cards.length; i += columns) {
    let height = 0;
    for (let j = i; j < Math.min(i + columns, cards.length); j++) height = Math.max(height, cards[j].getBoundingClientRect().height);
    heights.push(height);
  }
  return heights;
}

function place(grid: HTMLElement, rowHeights: number[], gap: number, columns: number, count: number): GridWindow {
  const screen = window.innerHeight;
  // The grid's own top edge on the page; its padding stands in for the rows above the window, so it does not move it.
  const gridTop = grid.getBoundingClientRect().top;
  return windowRows({ rowHeights, gap, columns, count, viewTop: -gridTop, viewBottom: -gridTop + screen, overscan: screen * OVERSCAN_SCREENS });
}
