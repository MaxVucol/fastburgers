import Link from "next/link";
import { Banknote, ClipboardList, Flame, Receipt, Timer, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { cn } from "@/lib/utils";
import { listAudit } from "@/services/audit";
import { getCatalogAttention, getDashboardStats } from "@/services/orders";

export const generateMetadata = () => adminTitle("dashboard");

const DAY = 24 * 60 * 60 * 1000;
const PRESETS = [
  { key: "today", label: "today" },
  { key: "7d", label: "d7" },
  { key: "30d", label: "d30" },
  { key: "90d", label: "d90" },
] as const;

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** "today" | "7d" | … or a custom from/to (YYYY-MM-DD, to inclusive). */
function resolvePeriod(params: Record<string, string | string[] | undefined>) {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const day = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : null);
  const customFrom = day(str(params.from));
  const customTo = day(str(params.to));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (customFrom && customTo && customFrom <= customTo) {
    return { key: "custom", from: customFrom, to: new Date(customTo.getTime() + DAY), fromRaw: str(params.from), toRaw: str(params.to) };
  }
  const key = PRESETS.some((p) => p.key === params.period) ? (params.period as string) : "30d";
  const days = key === "today" ? 1 : Number.parseInt(key, 10);
  return { key, from: new Date(startOfToday.getTime() - (days - 1) * DAY), to: new Date(startOfToday.getTime() + DAY), fromRaw: "", toRaw: "" };
}

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const d = a.dashboard;
  const price = (bani: number) => formatPrice(bani, locale);
  const params = await searchParams;
  const period = resolvePeriod(params);
  const kind = params.kind === "real" || params.kind === "demo" ? params.kind : undefined;
  const [stats, attention, changes] = await Promise.all([
    getDashboardStats({ from: period.from, to: period.to, kind }),
    getCatalogAttention(),
    listAudit({ take: 8 }),
  ]);
  const maxQty = Math.max(1, ...stats.topProducts.map((p) => p.quantity));
  const query = (next: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ period: period.key === "custom" ? undefined : period.key, kind, ...next })) if (v) q.set(k, v);
    return `/admin?${q}`;
  };
  const pill = (active: boolean) =>
    cn("inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold", active ? "bg-ink text-on-ink" : "bg-paper text-ink-soft ring-1 ring-line hover:bg-sand");

  return (
    <>
      <AdminPageHeader title={a.meta.dashboard} description={d.lead} />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label={d.period} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <Link key={p.key} href={query({ period: p.key })} className={pill(period.key === p.key)} aria-current={period.key === p.key ? "page" : undefined}>
              {d[p.label]}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
          {[
            { key: undefined, label: d.all },
            { key: "real", label: d.real },
            { key: "demo", label: d.demo },
          ].map((k) => (
            <Link key={k.label} href={query({ kind: k.key ?? "" })} className={pill(kind === k.key)} aria-current={kind === k.key ? "page" : undefined}>
              {k.label}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap items-center gap-2 text-sm">
          {kind && <input type="hidden" name="kind" value={kind} />}
          <label className="flex items-center gap-2">
            {a.common.from} <input type="date" name="from" defaultValue={period.fromRaw} required className="h-9 rounded-lg border border-line bg-paper px-2" />
          </label>
          <label className="flex items-center gap-2">
            {a.common.to} <input type="date" name="to" defaultValue={period.toRaw} required className="h-9 rounded-lg border border-line bg-paper px-2" />
          </label>
          <button type="submit" className={buttonStyles({ variant: "dark", size: "sm" })}>{a.common.apply}</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={d.ordersInPeriod} value={String(stats.orderCount)} hint={fill(d.cancelledCount, { count: stats.cancelled })} icon={ClipboardList} />
        <StatCard label={d.sales} value={price(stats.revenue)} hint={fill(d.completed, { amount: price(stats.completedRevenue) })} icon={Banknote} />
        <StatCard label={d.averageTicket} value={price(stats.averageTicket)} hint={d.averageHint} icon={Receipt} />
        <StatCard label={d.newNow} value={String(stats.newNow)} hint={d.newHint} icon={Flame} />
        <StatCard label={d.openNow} value={String(stats.openNow)} hint={d.openHint} icon={Timer} />
        <StatCard label={d.cancelled} value={String(stats.cancelled)} icon={XCircle} />
      </div>
      <p className="mt-3 text-xs text-muted">{d.note}</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={d.recent}
          action={<Link href="/admin/orders" className="text-sm font-semibold text-accent-ink hover:underline">{d.allOrders}</Link>}
        >
          {stats.recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-muted">{d.noOrders}</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-cream">
                    <span className="font-mono text-sm font-semibold">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{o.customerName}</span>
                    <span className="text-xs text-muted">{formatDateTime(o.createdAt, locale)}</span>
                    <StatusBadge status={o.status} label={a.status[o.status]} />
                    <span className="w-24 text-right font-semibold tabular-nums">{price(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={d.top}>
          {stats.topProducts.length === 0 ? (
            <p className="p-5 text-sm text-muted">{d.noSales}</p>
          ) : (
            <ol className="space-y-4 p-5">
              {stats.topProducts.map((p) => (
                <li key={p.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-muted tabular-nums">
                      {fill(a.common.pieces, { count: p.quantity })} · {price(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand" aria-hidden>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title={d.attention}
          action={<Link href="/admin/products?status=hidden" className="text-sm font-semibold text-accent-ink hover:underline">{d.productsLink}</Link>}
        >
          {attention.length === 0 ? (
            <p className="p-5 text-sm text-muted">{d.allGood}</p>
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-cream">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {[p.draft && d.draft, !p.active && d.hidden, p.soldOut && d.soldOut].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title={d.changes}
          action={<Link href="/admin/audit" className="text-sm font-semibold text-accent-ink hover:underline">{d.auditLink}</Link>}
        >
          {changes.length === 0 ? (
            <p className="p-5 text-sm text-muted">{d.noChanges}</p>
          ) : (
            <ul className="divide-y divide-line">
              {changes.map((e) => (
                <li key={e.id} className="px-5 py-3 text-sm">
                  <span className="block truncate font-semibold">{e.summary}</span>
                  <span className="text-xs text-muted">
                    {formatDateTime(e.createdAt, locale)} · {e.actorEmail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
