/**
 * Shared look of the round icon buttons on the dark header bar (theme, search, account, cart,
 * mobile menu): one 44 px hit area (40 px only in the tight 1024–1279 px desktop range), one icon
 * size and one stroke weight, so the group reads as a single set. Hover is a faint neutral fill.
 */
export const headerIconButton =
  "relative grid size-11 shrink-0 place-items-center rounded-full text-on-dark/85 transition-colors duration-[var(--duration-fast)] hover:bg-on-dark/[0.08] hover:text-on-dark lg:size-10 xl:size-11";

export const headerIcon = { className: "size-[1.375rem]", strokeWidth: 1.7, "aria-hidden": true } as const;
