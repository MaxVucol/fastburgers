import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { formatDateTime, formatPrice } from "@/lib/format";
import { plural, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Status pill using theme tokens (readable in both themes). */
export function OrderStatusPill({ status, label }: { status: OrderStatus; label: string }) {
  const tone =
    status === "CANCELLED"
      ? "bg-sand text-muted"
      : status === "COMPLETED"
        ? "bg-herb-soft text-herb"
        : "bg-accent-soft text-accent-ink";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", tone)}>{label}</span>;
}

type Row = { id: string; number: string; status: OrderStatus; total: number; createdAt: Date; _count: { items: number } };

export function OrderRows({ orders, locale, t, href }: { orders: Row[]; locale: Locale; t: Dictionary; href: (p: string) => string }) {
  return (
    <ul className="divide-y divide-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link
            href={href(`/account/orders/${o.number}`)}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[9rem_minmax(0,1fr)_auto_auto]"
          >
            <span className="font-mono text-sm font-semibold">{o.number}</span>
            <span className="text-right font-semibold tabular-nums sm:order-last">{formatPrice(o.total, locale)}</span>
            <span className="text-sm text-muted">
              {formatDateTime(o.createdAt, locale)} · {plural(locale, o._count.items, t.me.orders.items)}
            </span>
            <span className="flex items-center justify-end gap-2">
              <OrderStatusPill status={o.status} label={t.order.statuses[o.status]} />
              <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              <span className="sr-only">{t.me.orders.open}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
