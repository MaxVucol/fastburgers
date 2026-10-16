import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { DeliveryMethod, OrderStatus } from "@prisma/client";
import { OrderRowActions } from "@/components/admin/order-row-actions";
import { AdminPageHeader, EmptyState, Panel, SegmentTabs, StatusBadge, adminControl, adminButton } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { ORDER_STATUSES } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { getOrderItemSummaries, getOrderStatusCounts } from "@/services/admin-dashboard";
import { listOrders } from "@/services/orders";

export const generateMetadata = () => adminTitle("orders");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.orders;
  const u = a.ui;
  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const status = ORDER_STATUSES.find((s) => s === params.status) as OrderStatus | undefined;
  const q = str(params.q).slice(0, 60);
  const fromRaw = str(params.from);
  const toRaw = str(params.to);
  const kind = params.kind === "demo" || params.kind === "real" ? (params.kind as "demo" | "real") : undefined;
  const method = params.method === "DELIVERY" || params.method === "PICKUP" ? (params.method as DeliveryMethod) : undefined;
  const day = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : undefined);
  const from = day(fromRaw);
  const toDay = day(toRaw);
  const to = toDay ? new Date(toDay.getTime() + 24 * 60 * 60 * 1000) : undefined;
  const base = { q, from, to, kind, method };
  const [orders, tabs] = await Promise.all([listOrders({ ...base, status }), getOrderStatusCounts(base)]);
  const items = await getOrderItemSummaries(orders.map((o) => o.id));
  const filtered = Boolean(status || q || from || to || kind || method);

  /** The current filters with some replaced (status tabs keep search, dates and method). */
  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const all = { q, from: fromRaw, to: toRaw, kind, method, status, ...next };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };
  const summary = (id: string) => {
    const it = items.get(id);
    return it ? `${it.lines.join(", ")}${it.more ? ` ${fill(u.more, { count: it.more })}` : ""}` : "—";
  };

  return (
    <>
      <AdminPageHeader title={a.meta.orders} description={filtered ? fill(t.found, { count: orders.length }) : t.latest} />

      <SegmentTabs
        label={u.tabsLabel}
        className="mb-4"
        items={[
          { href: href({ status: undefined }), label: u.tabAll, active: !status, count: tabs.total },
          ...ORDER_STATUSES.map((s) => ({ href: href({ status: s }), label: a.status[s], active: status === s, count: tabs.counts[s] ?? 0 })),
        ]}
      />

      <form role="search" className="mb-5 rounded-2xl border border-line bg-paper p-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-[minmax(12rem,1fr)_9.5rem_9.5rem_10.5rem_11.5rem_auto]">
          <label className="relative col-span-2 md:col-span-4 2xl:col-span-1">
            <span className="sr-only">{a.common.search}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input name="q" type="search" defaultValue={q} placeholder={t.searchPlaceholder} className={cn(adminControl, "w-full pl-9")} />
          </label>
          <label className="grid gap-1">
            <span className="sr-only">{t.fromDate}</span>
            <input type="date" name="from" defaultValue={fromRaw} className={cn(adminControl, "w-full")} aria-label={t.fromDate} title={t.fromDate} />
          </label>
          <label className="grid gap-1">
            <span className="sr-only">{t.toDate}</span>
            <input type="date" name="to" defaultValue={toRaw} className={cn(adminControl, "w-full")} aria-label={t.toDate} title={t.toDate} />
          </label>
          <label>
            <span className="sr-only">{u.colMethod}</span>
            <select name="method" defaultValue={method ?? ""} className={cn(adminControl, "w-full")}>
              <option value="">{u.methodAll}</option>
              <option value="DELIVERY">{a.delivery.DELIVERY}</option>
              <option value="PICKUP">{a.delivery.PICKUP}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{t.kind}</span>
            <select name="kind" defaultValue={kind ?? ""} className={cn(adminControl, "w-full")}>
              <option value="">{t.kindAll}</option>
              <option value="real">{t.kindReal}</option>
              <option value="demo">{t.kindDemo}</option>
            </select>
          </label>
          <div className="col-span-2 flex gap-2 md:col-span-4 2xl:col-span-1">
            <button type="submit" className={cn(adminButton.dark, "flex-1")}>
              <SlidersHorizontal className="size-4" aria-hidden /> {a.common.filter}
            </button>
            {filtered && (
              <Link href="/admin/orders" className={adminButton.ghost}>
                {a.common.reset}
              </Link>
            )}
          </div>
        </div>
      </form>

      <Panel>
        {orders.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <>
            {/* Wide screens (from 1280 px): a real table. */}
            <table className="hidden w-full table-fixed text-sm xl:table">
              <colgroup>
                <col className="w-[9.5rem]" />
                <col className="w-[15%]" />
                <col className="w-[8rem]" />
                <col />
                <col className="w-[7rem]" />
                <col className="w-[8.75rem]" />
                <col className="hidden w-[10rem] 2xl:table-column" />
                <col className="w-[3.75rem]" />
              </colgroup>
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="py-3 pr-3 pl-5 font-semibold">{u.colNumber}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{u.colCustomer}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{u.colDate}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{u.colItems}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{u.colTotal}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{u.colStatus}</th>
                  <th scope="col" className="hidden px-3 py-3 font-semibold 2xl:table-cell">{u.colMethod}</th>
                  <th scope="col" className="py-3 pr-5 pl-3 text-right font-semibold"><span className="sr-only">{u.colActions}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-sand/50">
                    <td className="py-3 pr-3 pl-5 whitespace-nowrap">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-[0.8125rem] font-semibold hover:text-accent-ink">
                        {o.number}
                      </Link>
                      {o.demo && <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-[0.6875rem] font-semibold text-muted">{a.common.demo}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block truncate font-medium">{o.customerName}</span>
                      <span className="block truncate text-xs text-muted tabular-nums">{o.customerPhone}</span>
                    </td>
                    <td className="truncate px-3 py-3 text-muted">{formatDateTime(o.createdAt, locale)}</td>
                    <td className="truncate px-3 py-3 text-muted" title={summary(o.id)}>
                      {summary(o.id)}
                      <span className="block truncate text-xs 2xl:hidden">{a.delivery[o.deliveryMethod]}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatPrice(o.total, locale)}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} label={a.status[o.status]} /></td>
                    <td className="hidden truncate px-3 py-3 text-muted 2xl:table-cell">{a.delivery[o.deliveryMethod]}</td>
                    <td className="py-2 pr-5 pl-3 text-right">
                      <OrderRowActions id={o.id} number={o.number} status={o.status} method={o.deliveryMethod} phone={o.customerPhone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phones and tablets: one card per order, nothing squeezed. */}
            <ul className="divide-y divide-line xl:hidden">
              {orders.map((o) => (
                <li key={o.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
                  <Link href={`/admin/orders/${o.id}`} className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[0.8125rem] font-semibold">
                        {o.number}
                        {o.demo && <span className="ml-2 rounded bg-sand px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-muted">{a.common.demo}</span>}
                      </span>
                      <span className="font-semibold tabular-nums">{formatPrice(o.total, locale)}</span>
                    </span>
                    <span className="mt-1 block truncate text-sm font-medium">{o.customerName}</span>
                    <span className="block truncate text-xs text-muted">{summary(o.id)}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
                      <StatusBadge status={o.status} label={a.status[o.status]} />
                      <span>{a.delivery[o.deliveryMethod]}</span>
                      <span>{formatDateTime(o.createdAt, locale)}</span>
                    </span>
                  </Link>
                  <OrderRowActions id={o.id} number={o.number} status={o.status} method={o.deliveryMethod} phone={o.customerPhone} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </>
  );
}
