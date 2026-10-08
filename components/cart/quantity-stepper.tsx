"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_ITEM_QUANTITY } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  size = "md",
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: "sm" | "md";
  /** Accessible name of the product, e.g. "Classic Smash". */
  label: string;
}) {
  const btn = cn(
    "grid place-items-center rounded-lg text-ink transition-colors hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      className={cn("inline-flex items-center rounded-xl bg-sand p-1", size === "sm" ? "gap-0.5" : "gap-1")}
      role="group"
      aria-label={`Cantitate ${label}`}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={value <= 1 && min === 0 ? `Elimină ${label}` : `Scade cantitatea pentru ${label}`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output
        className={cn("text-center font-bold tabular-nums", size === "sm" ? "w-6 text-sm" : "w-8")}
        aria-live="polite"
      >
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_ITEM_QUANTITY}
        aria-label={`Crește cantitatea pentru ${label}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
