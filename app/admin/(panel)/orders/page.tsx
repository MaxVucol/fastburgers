import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listOrders } from "@/services/orders";

export const metadata: Metadata = { title: "Comenzi" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const status = ORDER_STATUSES.find((s) => s === params.status) as OrderStatus | undefined;
  const q = str(params.q).slice(0, 60);
  const fromRaw = str(params.from);
  const toRaw = str(params.to);
  const kind = params.kind === "demo" || params.kind === "real" ? params.kind : undefined;
  const day = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : undefined);
  const from = day(fromRaw);
  const toDay = day(toRaw);
  const to = toDay ? new Date(toDay.getTime() + 24 * 60 * 60 * 1000) : undefined;
  const orders = await listOrders({ status, q, from, to, kind });
  const filtered = Boolean(status || q || from || to || kind);

  const control = "h-11 rounded-xl border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <>
      <AdminPageHeader title="Comenzi" description={filtered ? `${orders.length} comenzi găsite (maxim 100).` : "Ultimele 100 de comenzi, cele mai noi primele."} />
      <form role="search" className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_9.5rem_9.5rem_9rem_auto]">
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Caută</span>
          <input name="q" defaultValue={q} placeholder="Număr, nume sau telefon…" className={cn(control, "w-full")} />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status ?? ""} className={cn(control, "w-full")}>
            <option value="">Toate statusurile</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">De la</span>
          <input type="date" name="from" defaultValue={fromRaw} className={cn(control, "w-full")} aria-label="De la data" />
        </label>
        <label>
          <span className="sr-only">Până la</span>
          <input type="date" name="to" defaultValue={toRaw} className={cn(control, "w-full")} aria-label="Până la data (inclusiv)" />
        </label>
        <label>
          <span className="sr-only">Tip</span>
          <select name="kind" defaultValue={kind ?? ""} className={cn(control, "w-full")}>
            <option value="">Reale și demo</option>
            <option value="real">Doar reale</option>
            <option value="demo">Doar demo</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={cn(buttonStyles({ variant: "dark" }), "flex-1")}>Filtrează</button>
          {filtered && <Link href="/admin/orders" className={buttonStyles({ variant: "ghost" })}>Resetează</Link>}
        </div>
      </form>

      <Panel>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nu există comenzi pentru acest filtru.</p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-cream md:grid-cols-[8.5rem_1fr_10rem_7rem_6.5rem]"
                >
                  <span className="font-mono text-sm font-semibold">
                    {o.number}
                    {o.demo && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 font-sans text-[0.6875rem] font-semibold text-muted">demo</span>}
                  </span>
                  <span className="text-right md:order-last">
                    <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span>
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-semibold">{o.customerName}</span>
                    <span className="block text-xs text-muted">
                      {DELIVERY_METHOD_LABEL[o.deliveryMethod]} · {o._count.items} produse
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted md:text-left">{formatDateTime(o.createdAt)}</span>
                  <span className="col-span-2 md:col-span-1">
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
