"use client";

import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { fill } from "@/lib/i18n/config";
import { MAX_ITEM_QUANTITY } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  size = "md",
  tone = "light",
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: "sm" | "md";
  tone?: "light" | "dark";
  /** Accessible name of the product, e.g. "Classic Smash". */
  label: string;
}) {
  const { t } = useI18n();
  const dark = tone === "dark";
  const btn = cn(
    "grid place-items-center rounded-full transition-colors duration-[var(--duration-fast)] disabled:opacity-35",
    dark ? "text-on-dark hover:bg-graphite-soft disabled:hover:bg-transparent" : "text-ink hover:bg-paper disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-[1.5px] p-0.5",
        dark ? "border-line-dark" : "border-line bg-sand/60",
      )}
      role="group"
      aria-label={fill(t.quantity.group, { name: label })}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={
          value <= 1 && min === 0 ? fill(t.quantity.remove, { name: label }) : fill(t.quantity.decrease, { name: label })
        }
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output
        className={cn("text-center font-semibold tabular-nums", size === "sm" ? "w-6 text-sm" : "w-8")}
        aria-live="polite"
      >
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_ITEM_QUANTITY}
        aria-label={fill(t.quantity.increase, { name: label })}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
