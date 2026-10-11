import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { listOrders } from "@/services/orders";

export const metadata: Metadata = { title: "Comenzi" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { status: rawStatus } = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === rawStatus) as OrderStatus | undefined;
  const orders = await listOrders(status);

  const tab = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold",
      active ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-sand",
    );

  return (
    <>
      <AdminPageHeader title="Comenzi" description="Ultimele 100 de comenzi, cele mai noi primele." />
      <nav aria-label="Filtru status" className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={tab(!status)} aria-current={!status ? "page" : undefined}>
          Toate
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={tab(status === s)} aria-current={status === s ? "page" : undefined}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

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
