import { cn } from "@/lib/utils";

// The brand's small graphic vocabulary — a few marks, reused deliberately:
//  - Crown: the BUNIQ symbol (logo, eyebrows, a few accents next to food)
//  - Strokes: three "sizzle" lines (motion/heat next to food)
//  - Swash: a hand-drawn line under handwritten notes
//  - ScribbleArrow: points a handwritten note at the food it describes

/** Outlined three-point crown with a base band. Inherits colour from `currentColor`. */
export function Crown({ className, strokeWidth = 3.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 48 36"
      className={cn("h-4 w-auto", className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 25.5 5 8.5l10.6 8.6L24 4l8.4 13.1L43 8.5l-3.5 17Z" />
      <path d="M9.5 31.5h29" />
    </svg>
  );
}

export function Strokes({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-14", className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
    >
      <path d="M34 6 49 19" />
      <path d="M8 26l26 6" />
      <path d="M12 52 33 44" />
    </svg>
  );
}

export function Swash({ className, stretch = false }: { className?: string; stretch?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 16"
      className={cn("h-3 w-24", className)}
      /* stretch: follow the box width (e.g. under a whole headline) instead of keeping proportions */
      preserveAspectRatio={stretch ? "none" : undefined}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      <path d="M3 11c22-6 58-9 86-6 9 1 17 3 28 1" />
    </svg>
  );
}

/** A loose hand-drawn arrow pointing down-right — pairs with a handwritten note. */
export function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={cn("h-8 w-12", className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M58 6C46 4 30 8 22 18c-5 6-6 12-3 17" />
      <path d="M11 28l8 8 8-7" />
    </svg>
  );
}
