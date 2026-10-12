import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/admin-controls";
import { Panel, StatusBadge } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/order-status";
import { isObjectId } from "@/lib/utils";
import { listAudit } from "@/services/audit";
import { getOrderById } from "@/services/orders";

export const metadata: Metadata = { title: "Detalii comandă" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Comenzi
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold sm:text-3xl">{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">Plasată {formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={`Produse (${order.items.length})`}>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.quantity} × {item.productName}
                  </p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-muted">
                      + {item.options.map((o) => `${o.name} (${formatPrice(o.price)})`).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted">{formatPrice(item.price)} / buc</p>
                </div>
                <span className="font-semibold tabular-nums">{formatPrice(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Livrare</dt><dd className="tabular-nums">{formatPrice(order.deliveryFee)}</dd></div>
            <div className="flex justify-between pt-1 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <OrderStatusSelect id={order.id} status={order.status} method={order.deliveryMethod} />
          </Panel>
          <OrderHistory id={order.id} createdAt={order.createdAt} />
          <Panel title="Client">
            <ul className="space-y-3 p-5 text-sm">
              <li className="font-semibold">
                {order.customerName}
                {order.userId ? (
                  <Link href={`/admin/users/${order.userId}`} className="ml-2 text-xs font-semibold text-accent-ink hover:underline">cont client</Link>
                ) : (
                  <span className="ml-2 text-xs font-normal text-muted">fără cont</span>
                )}
                {order.demo && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">demo</span>}
              </li>
              <li>
                <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 hover:text-accent-ink">
                  <Phone className="size-4 text-muted" aria-hidden /> {order.customerPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 break-all hover:text-accent-ink">
                  <Mail className="size-4 shrink-0 text-muted" aria-hidden /> {order.customerEmail}
                </a>
              </li>
            </ul>
          </Panel>
          <Panel title="Livrare și plată">
            <ul className="space-y-3 p-5 text-sm">
              <li className="font-semibold">{DELIVERY_METHOD_LABEL[order.deliveryMethod]}</li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                {order.deliveryMethod === "DELIVERY"
                  ? order.deliveryAddress
                  : order.location
                    ? `${order.location.name} — ${order.location.address}`
                    : "Locație ștearsă"}
              </li>
              <li className="text-muted">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</li>
              {order.notes && (
                <li className="flex gap-2 rounded-xl bg-mustard-soft p-3 text-ink">
                  <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {order.notes}
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Status changes recorded in the audit log (who and when). */
async function OrderHistory({ id, createdAt }: { id: string; createdAt: Date }) {
  const entries = await listAudit({ entity: "order", entityId: id, take: 50 });
  return (
    <Panel title="Istoric">
      <ol className="space-y-3 p-5 text-sm">
        {entries.map((e) => (
          <li key={e.id}>
            <span className="block font-semibold">{e.summary.replace(/^[^:]+:\s*/, "")}</span>
            <span className="text-xs text-muted">
              {formatDateTime(e.createdAt)} · {e.actorEmail}
            </span>
          </li>
        ))}
        <li>
          <span className="block font-semibold">Comandă plasată</span>
          <span className="text-xs text-muted">{formatDateTime(createdAt)}</span>
        </li>
      </ol>
    </Panel>
  );
}
