import { cn } from "@/lib/utils";

// The brand's small graphic vocabulary — three marks, reused deliberately:
//  - Spark: the six-point asterisk from the logo (bullets, section markers)
//  - Strokes: three "sizzle" lines (motion/heat next to food)
//  - Underline: a hand-drawn swash under handwritten notes

export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden fill="currentColor">
      <rect x="9.9" y="1" width="4.2" height="22" rx="2.1" />
      <rect x="9.9" y="1" width="4.2" height="22" rx="2.1" transform="rotate(60 12 12)" />
      <rect x="9.9" y="1" width="4.2" height="22" rx="2.1" transform="rotate(120 12 12)" />
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

export function Swash({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 16"
      className={cn("h-3 w-24", className)}
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
