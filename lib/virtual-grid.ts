// Windowing for a grid of equal-width cards that lists its items row by row: which rows to keep in the page for
// the current scroll position. Pure arithmetic, so it can be tested without a browser (see components/product/use-virtual-grid.ts).

export type GridWindow = {
  /** First and one-past-last item to render. */
  start: number;
  end: number;
  /** Height of the rows that are not rendered above and below, to keep the page the same length. */
  padTop: number;
  padBottom: number;
};

/** The rows (their heights, with `gap` between rows) that are within `overscan` pixels of the screen. */
export function windowRows({
  rowHeights,
  gap,
  columns,
  count,
  viewTop,
  viewBottom,
  overscan,
}: {
  rowHeights: readonly number[];
  gap: number;
  columns: number;
  count: number;
  /** The top and bottom edge of the screen, measured from the top of the grid. */
  viewTop: number;
  viewBottom: number;
  overscan: number;
}): GridWindow {
  const rows = rowHeights.length;
  if (rows === 0 || count === 0) return { start: 0, end: count, padTop: 0, padBottom: 0 };

  const from = viewTop - overscan;
  const to = viewBottom + overscan;
  const tops: number[] = [];
  let offset = 0;
  for (const height of rowHeights) {
    tops.push(offset);
    offset += height + gap;
  }
  const total = offset - gap;

  let first = 0;
  while (first < rows - 1 && tops[first] + rowHeights[first] < from) first++;
  let last = first;
  while (last < rows - 1 && tops[last + 1] <= to) last++;

  return {
    start: first * columns,
    end: Math.min(count, (last + 1) * columns),
    padTop: tops[first],
    padBottom: last === rows - 1 ? 0 : Math.max(0, total - (tops[last] + rowHeights[last])),
  };
}
