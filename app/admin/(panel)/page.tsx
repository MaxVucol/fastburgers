import Image from "next/image";
import Link from "next/link";
import { BellRing, Banknote, CalendarRange, ClipboardList, FolderPlus, ImageOff, Plus, Receipt, Scale, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState, KpiCard, Panel, PanelLink, SegmentTabs, StatusBadge, adminControl, adminButton } from "@/components/admin/admin-ui";
import { SalesChart, type ChartPoint } from "@/components/admin/sales-chart";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { fill, intlLocale } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { cn } from "@/lib/utils";
import { listAudit } from "@/services/audit";
import { countNewCustomers, getOrderItemSummaries, getProductThumbs, getSalesSeries } from "@/services/admin-dashboard";
import { getCatalogAttention, getDashboardStats } from "@/services/orders";

export const generateMetadata = () => adminTitle("dashboard");

const DAY = 24 * 60 * 60 * 1000;
const PRESETS = [
  { key: "today", label: "today" },
  { key: "7d", label: "d7" },
  { key: "30d", label: "d30" },
  { key: "90d", label: "d90" },
] as const;

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

/** Change against the previous period of the same length; null when there is nothing to compare. */
function change(current: number, previous: number) {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct);
  return { pct: rounded, direction: Math.abs(pct) < 0.5 ? ("flat" as const) : pct > 0 ? ("up" as const) : ("down" as const) };
}

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const d = a.dashboard;
  const u = a.ui;
  const price = (bani: number) => formatPrice(bani, locale);
  const params = await searchParams;
  const period = resolvePeriod(params);
  const kind = params.kind === "real" || params.kind === "demo" ? params.kind : undefined;
  const span = period.to.getTime() - period.from.getTime();
  const previous = { from: new Date(period.from.getTime() - span), to: period.from };

  const [stats, prevStats, series, newCustomers, prevCustomers, attention, changes] = await Promise.all([
    getDashboardStats({ from: period.from, to: period.to, kind }),
    getDashboardStats({ from: previous.from, to: previous.to, kind }),
    getSalesSeries({ from: period.from, to: period.to, kind }),
    countNewCustomers(period.from, period.to),
    countNewCustomers(previous.from, previous.to),
    getCatalogAttention(),
    listAudit({ take: 6 }),
  ]);
  const [items, thumbs] = await Promise.all([
    getOrderItemSummaries(stats.recentOrders.map((o) => o.id)),
    getProductThumbs(stats.topProducts.map((p) => p.productId)),
  ]);

  // Axis and tooltip labels in the server's time zone — the same one the buckets were cut in.
  const tag = intlLocale[locale];
  const axis = new Intl.DateTimeFormat(tag, series.unit === "hour" ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" });
  const full = new Intl.DateTimeFormat(tag, series.unit === "hour" ? { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" } : { weekday: "short", day: "numeric", month: "long" });
  const points: ChartPoint[] = series.points.map((p) => ({
    label: axis.format(new Date(p.start)),
    fullLabel: full.format(new Date(p.start)),
    revenue: p.revenue,
    orders: p.orders,
    revenueText: price(p.revenue),
  }));

  const trend = (current: number, prev: number, show: (pct: number) => string = (pct) => `${pct > 0 ? "+" : ""}${pct}%`) => {
    const c = change(current, prev);
    return c ? { text: show(c.pct), direction: c.direction, caption: u.vsPrevious } : null;
  };

  const query = (next: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ period: period.key === "custom" ? undefined : period.key, kind, ...next })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/admin?${s}` : "/admin";
  };
  const maxQty = Math.max(1, ...stats.topProducts.map((p) => p.quantity));
  const firstName = admin.name.split(" ")[0] || admin.name;

  const quick: { href: string; label: string; hint: string; icon: LucideIcon }[] = [
    { href: "/admin/products/new", label: u.qaProduct, hint: u.qaProductHint, icon: Plus },
    { href: "/admin/categories/new", label: u.qaCategory, hint: u.qaCategoryHint, icon: FolderPlus },
    { href: "/admin/users", label: u.qaUsers, hint: u.qaUsersHint, icon: Users },
    { href: "/admin/market", label: u.qaMarket, hint: u.qaMarketHint, icon: Scale },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.75rem]">{fill(u.welcome, { name: firstName })}</h1>
          <p className="mt-1 text-sm text-muted">{u.welcomeLead}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <SegmentTabs
            label={d.period}
            items={PRESETS.map((p) => ({ href: query({ period: p.key }), label: d[p.label], active: period.key === p.key }))}
          />
          <details className="group relative">
            <summary
              className={cn(
                "inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden",
                period.key === "custom" ? "border-accent bg-accent text-on-accent" : "border-line bg-paper text-ink-soft hover:text-ink",
              )}
            >
              <CalendarRange className="size-4" aria-hidden />
              {period.key === "custom" ? `${period.fromRaw} – ${period.toRaw}` : u.customPeriod}
            </summary>
            <form className="absolute top-full right-0 z-20 mt-2 grid w-72 gap-3 rounded-xl border border-line bg-paper p-4 shadow-[var(--shadow-lift)] max-sm:left-0">
              {kind && <input type="hidden" name="kind" value={kind} />}
              <label className="grid gap-1 text-xs font-semibold text-muted">
                {a.common.from}
                <input type="date" name="from" defaultValue={period.fromRaw} required className={adminControl} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">
                {a.common.to}
                <input type="date" name="to" defaultValue={period.toRaw} required className={adminControl} />
              </label>
              <button type="submit" className={adminButton.primary}>{a.common.apply}</button>
            </form>
          </details>
          <SegmentTabs
            label={u.kindLabel}
            items={[
              { href: query({ kind: "" }), label: d.all, active: !kind },
              { href: query({ kind: "real" }), label: d.real, active: kind === "real" },
              { href: query({ kind: "demo" }), label: d.demo, active: kind === "demo" },
            ]}
          />
        </div>
      </div>

      {stats.newNow > 0 && (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
            <BellRing className="size-5" aria-hidden />
          </span>
          <div className="min-w-[10rem] flex-1">
            <p className="font-semibold">{fill(u.newOrdersTitle, { count: stats.newNow })}</p>
            <p className="text-sm text-muted">{u.newOrdersText}</p>
          </div>
          <Link href="/admin/orders?status=NEW" className={adminButton.primary}>
            {u.goToOrders}
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={u.revenue} value={price(stats.revenue)} icon={Banknote} trend={trend(stats.revenue, prevStats.revenue)} hint={u.noPrevious} />
        <KpiCard label={u.ordersKpi} value={String(stats.orderCount)} icon={ClipboardList} trend={trend(stats.orderCount, prevStats.orderCount)} hint={u.noPrevious} />
        <KpiCard label={u.averageTicket} value={price(stats.averageTicket)} icon={Receipt} trend={trend(stats.averageTicket, prevStats.averageTicket)} hint={d.averageHint} />
        <KpiCard label={u.newCustomers} value={String(newCustomers)} icon={UserPlus} trend={trend(newCustomers, prevCustomers)} hint={u.newCustomersHint} />
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <li title={u.inWorkHint}>
          {u.inWork}: <span className="font-semibold text-ink tabular-nums">{stats.openNow}</span>
        </li>
        <li>
          {d.cancelled}: <span className="font-semibold text-ink tabular-nums">{stats.cancelled}</span>
        </li>
        <li>{fill(d.completed, { amount: price(stats.completedRevenue) })}</li>
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <Panel plain title={u.salesTrend}>
            <div className="px-5 pb-5">
              <SalesChart
                points={points}
                locale={tag}
                labels={{
                  metric: u.metric,
                  revenue: u.metricRevenue,
                  orders: u.metricOrders,
                  empty: u.chartEmpty,
                  table: u.chartTable,
                  period: series.unit === "hour" ? u.chartHour : u.chartDay,
                }}
              />
              <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">{d.note}</p>
            </div>
          </Panel>

          <Panel plain title={d.recent} action={<PanelLink href="/admin/orders">{d.allOrders}</PanelLink>}>
            {stats.recentOrders.length === 0 ? (
              <EmptyState>{d.noOrders}</EmptyState>
            ) : (
              <>
                <div className="hidden md:block">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col className="w-[8.5rem]" />
                      <col />
                      <col className="w-[7.5rem]" />
                      <col className="hidden 2xl:table-column" />
                      <col className="w-[6.5rem]" />
                      <col className="w-[8.5rem]" />
                    </colgroup>
                    <thead className="border-y border-line bg-cream/50 text-left text-xs font-semibold text-muted">
                      <tr>
                        <th scope="col" className="py-2.5 pr-3 pl-5 font-semibold">{u.colNumber}</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">{u.colCustomer}</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">{u.colDate}</th>
                        <th scope="col" className="hidden px-3 py-2.5 font-semibold 2xl:table-cell">{u.colItems}</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-semibold">{u.colTotal}</th>
                        <th scope="col" className="py-2.5 pr-5 pl-3 font-semibold">{u.colStatus}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {stats.recentOrders.map((o) => {
                        const it = items.get(o.id);
                        return (
                          <tr key={o.id} className="hover:bg-sand/50">
                            <td className="py-3 pr-3 pl-5 whitespace-nowrap">
                              <Link href={`/admin/orders/${o.id}`} className="font-mono text-[0.8125rem] font-semibold hover:text-accent-ink">{o.number}</Link>
                            </td>
                            <td className="truncate px-3 py-3">
                              {o.customerName}
                              <span className="block truncate text-xs text-muted 2xl:hidden">
                                {it ? `${it.lines.join(", ")}${it.more ? ` ${fill(u.more, { count: it.more })}` : ""}` : ""}
                              </span>
                            </td>
                            <td className="truncate px-3 py-3 text-muted">{formatDateTime(o.createdAt, locale)}</td>
                            <td className="hidden truncate px-3 py-3 text-muted 2xl:table-cell">
                              {it ? `${it.lines.join(", ")}${it.more ? ` ${fill(u.more, { count: it.more })}` : ""}` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{price(o.total)}</td>
                            <td className="py-3 pr-5 pl-3"><StatusBadge status={o.status} label={a.status[o.status]} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-line border-t border-line md:hidden">
                  {stats.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[1fr_auto] gap-1 px-5 py-3 hover:bg-sand/50">
                        <span className="font-mono text-[0.8125rem] font-semibold">{o.number}</span>
                        <span className="text-right font-semibold tabular-nums">{price(o.total)}</span>
                        <span className="truncate text-sm text-muted">{o.customerName} · {formatDateTime(o.createdAt, locale)}</span>
                        <span className="text-right"><StatusBadge status={o.status} label={a.status[o.status]} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel plain title={u.popular} action={<PanelLink href="/admin/products">{u.allProducts}</PanelLink>}>
            {stats.topProducts.length === 0 ? (
              <EmptyState>{d.noSales}</EmptyState>
            ) : (
              <ol className="space-y-3.5 px-5 pb-5">
                {stats.topProducts.map((p) => {
                  const img = thumbs.get(p.productId);
                  return (
                    <li key={p.productId} className="flex items-center gap-3">
                      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-sand text-muted">
                        {img ? <Image src={img} alt="" fill sizes="44px" className="object-cover" /> : <ImageOff className="size-4" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-semibold">{p.name}</span>
                          <span className="shrink-0 text-xs text-muted tabular-nums">{fill(a.common.pieces, { count: p.quantity })}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand" aria-hidden>
                            <span className="block h-full rounded-full bg-accent" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                          </span>
                          <span className="shrink-0 text-xs text-muted tabular-nums">{price(p.revenue)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel plain title={u.quickActions}>
            <ul className="grid grid-cols-2 gap-2.5 px-5 pb-5">
              {quick.map(({ href, label, hint, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex h-full flex-col gap-2 rounded-xl border border-line bg-cream/40 p-3.5 transition-colors hover:border-accent/50 hover:bg-accent-soft/40">
                    <Icon className="size-5 text-accent-ink" aria-hidden strokeWidth={1.9} />
                    <span className="text-sm leading-tight font-semibold">{label}</span>
                    <span className="text-xs leading-snug text-muted">{hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel plain title={d.changes} action={<PanelLink href="/admin/audit">{d.auditLink}</PanelLink>}>
            {changes.length === 0 ? (
              <EmptyState>{d.noChanges}</EmptyState>
            ) : (
              <ol className="relative mx-5 mb-5 border-l border-line">
                {changes.map((e) => (
                  <li key={e.id} className="relative pb-3.5 pl-4 last:pb-0">
                    <span className="absolute top-1.5 -left-[0.3125rem] size-2.5 rounded-full border-2 border-paper bg-accent" aria-hidden />
                    <p className="text-sm leading-snug font-medium break-words">{e.summary}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateTime(e.createdAt, locale)} · {e.actorEmail}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel plain title={d.attention} action={<PanelLink href="/admin/products?status=hidden">{d.productsLink}</PanelLink>}>
            {attention.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">{d.allGood}</p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {attention.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-sand/50">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {[p.draft && d.draft, !p.active && d.hidden, p.soldOut && d.soldOut].filter(Boolean).join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
