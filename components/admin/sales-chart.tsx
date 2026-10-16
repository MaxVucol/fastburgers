"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ChartPoint = {
  /** Axis label ("15 oct" or "14:00") and the full label for the tooltip. */
  label: string;
  fullLabel: string;
  revenue: number;
  orders: number;
  revenueText: string;
};

type Metric = "revenue" | "orders";

const W = 800;
const H = 240;

/** A round upper bound for the axis (1, 2, 2.5, 5 × 10ⁿ) so ticks are readable numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= value) return m * exp;
  return 10 * exp;
}

/**
 * Sales over the selected period from real orders (non-cancelled). Revenue or number of orders,
 * switched here without a reload. The same numbers are in a visually hidden table for screen
 * readers; the hover tooltip is a convenience on top.
 */
export function SalesChart({
  points,
  locale,
  labels,
}: {
  points: ChartPoint[];
  locale: string;
  labels: { metric: string; revenue: string; orders: string; empty: string; table: string; period: string };
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [hover, setHover] = useState<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  const values = points.map((p) => (metric === "revenue" ? p.revenue / 100 : p.orders));
  const max = niceMax(Math.max(...values, 0));
  const empty = values.every((v) => v === 0);
  const number = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);

  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * H;
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  // About seven labels on the x axis, whatever the number of buckets.
  const every = Math.max(1, Math.ceil(n / 7));

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(n === 1 ? 0 : Math.round(ratio * (n - 1)));
  }

  const hovered = hover !== null ? points[hover] : null;
  const hoverValue = hover !== null ? values[hover] : 0;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div role="group" aria-label={labels.metric} className="flex rounded-lg border border-line bg-sand p-0.5">
          {(["revenue", "orders"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={cn(
                "h-8 rounded-md px-3 text-xs font-semibold transition-colors",
                metric === m ? "bg-accent text-on-accent" : "text-muted hover:text-ink",
              )}
            >
              {labels[m]}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <p className="grid h-56 place-items-center rounded-xl border border-dashed border-line text-sm text-muted">{labels.empty}</p>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-x-3" aria-hidden>
          <div className="relative h-56 w-10 text-right text-[0.6875rem] text-muted tabular-nums">
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / max) * 100}%` }}>
                {number.format(t)}
              </span>
            ))}
          </div>
          <div
            ref={areaRef}
            className="relative h-56 touch-none"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={area} fill={`url(#${gradientId})`} />
              <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {hovered && (
              <>
                <span className="pointer-events-none absolute inset-y-0 w-px bg-ink/25" style={{ left: `${(x(hover!) / W) * 100}%` }} />
                <span
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-accent/25"
                  style={{ left: `${(x(hover!) / W) * 100}%`, top: `${(y(hoverValue) / H) * 100}%` }}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute top-1 z-10 rounded-lg border border-line bg-paper px-3 py-2 text-xs whitespace-nowrap shadow-[var(--shadow-lift)]",
                    x(hover!) / W > 0.6 ? "-translate-x-[calc(100%+0.75rem)]" : "translate-x-3",
                  )}
                  style={{ left: `${(x(hover!) / W) * 100}%` }}
                >
                  <span className="block font-semibold text-ink">{hovered.fullLabel}</span>
                  <span className="mt-0.5 block text-muted">
                    {labels.revenue}: <span className="font-semibold text-ink tabular-nums">{hovered.revenueText}</span>
                  </span>
                  <span className="block text-muted">
                    {labels.orders}: <span className="font-semibold text-ink tabular-nums">{hovered.orders}</span>
                  </span>
                </span>
              </>
            )}
          </div>
          <span />
          <div className="relative mt-2 h-4 text-[0.6875rem] text-muted">
            {points.map((p, i) => {
              const edge = i === 0 || i === n - 1;
              // Phones: first, middle and last label only; wider: about seven, never crowding the last one.
              const middle = i === Math.floor((n - 1) / 2);
              const regular = i % every === 0 && i + every <= n - 1;
              if (!edge && !middle && !regular) return null;
              return (
                <span
                  key={p.fullLabel}
                  className={cn(
                    "absolute whitespace-nowrap",
                    i === 0 ? "" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2",
                    !edge && !middle && "hidden sm:block",
                    middle && !edge && !regular && "sm:hidden",
                  )}
                  style={{ left: `${(x(i) / W) * 100}%` }}
                >
                  {p.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <table className="sr-only">
        <caption>
          {labels.table} · {labels.period}
        </caption>
        <thead>
          <tr>
            <th scope="col">{labels.period}</th>
            <th scope="col">{labels.revenue}</th>
            <th scope="col">{labels.orders}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.fullLabel}>
              <th scope="row">{p.fullLabel}</th>
              <td>{p.revenueText}</td>
              <td>{p.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
