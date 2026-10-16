import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/admin-controls";
import { Panel, StatusBadge } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { fill, type Locale } from "@/lib/i18n/config";
import type { AdminDictionary } from "@/lib/i18n/admin";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/order-status";
import { paymentBankName } from "@/lib/payment-banks";
import { isObjectId } from "@/lib/utils";
import { listAudit } from "@/services/audit";
import { getOrderById } from "@/services/orders";

export const generateMetadata = () => adminTitle("order");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.order;
  const price = (bani: number) => formatPrice(bani, locale);
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t.back}
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold sm:text-3xl">{order.number}</h1>
        <StatusBadge status={order.status} label={a.status[order.status]} />
        <span className="text-sm text-muted">{fill(t.placed, { date: formatDateTime(order.createdAt, locale) })}</span>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={fill(t.items, { count: order.items.length })}>
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
                      + {item.options.map((o) => `${o.name} (${price(o.price)})`).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted">{fill(a.common.perPiece, { price: price(item.price) })}</p>
                </div>
                <span className="font-semibold tabular-nums">{price(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{t.subtotal}</dt><dd className="tabular-nums">{price(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t.delivery}</dt><dd className="tabular-nums">{price(order.deliveryFee)}</dd></div>
            <div className="flex justify-between pt-1 text-base font-extrabold"><dt>{t.total}</dt><dd className="tabular-nums">{price(order.total)}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <OrderStatusSelect id={order.id} status={order.status} method={order.deliveryMethod} />
          </Panel>
          <OrderHistory id={order.id} createdAt={order.createdAt} a={a} locale={locale} />
          <Panel title={t.customer}>
            <ul className="space-y-3 p-5 text-sm">
              <li className="font-semibold">
                {order.customerName}
                {order.userId ? (
                  <Link href={`/admin/users/${order.userId}`} className="ml-2 text-xs font-semibold text-accent-ink hover:underline">{t.customerAccount}</Link>
                ) : (
                  <span className="ml-2 text-xs font-normal text-muted">{t.noAccount}</span>
                )}
                {order.demo && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">{a.common.demo}</span>}
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
          <Panel title={t.deliveryPayment}>
            <ul className="space-y-3 p-5 text-sm">
              <li className="font-semibold">{a.delivery[order.deliveryMethod]}</li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                {order.deliveryMethod === "DELIVERY"
                  ? order.deliveryAddress
                  : order.location
                    ? `${order.location.name} — ${order.location.address}`
                    : t.locationDeleted}
              </li>
              <li className="text-muted">
                {a.payment[order.paymentMethod]}
                {order.paymentBank && ` · ${paymentBankName(order.paymentBank, a.payment.otherBank)}`}
                {/* Nothing is charged on the site: the staff send the payment link. */}
                {order.paymentMethod === "CARD_ONLINE" && <span className="block font-semibold text-accent-ink">{a.payment.unpaid}</span>}
              </li>
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

/** The log stores "Nouă → Confirmată" (Romanian labels): shown with the panel's status names. */
function statusChange(text: string, a: AdminDictionary) {
  return text
    .split(" → ")
    .map((part) => {
      const status = ORDER_STATUSES.find((s) => ORDER_STATUS_LABEL[s] === part);
      return status ? a.status[status] : part;
    })
    .join(" → ");
}

/** Status changes recorded in the audit log (who and when). */
async function OrderHistory({ id, createdAt, a, locale }: { id: string; createdAt: Date; a: AdminDictionary; locale: Locale }) {
  const entries = await listAudit({ entity: "order", entityId: id, take: 50 });
  return (
    <Panel title={a.order.history}>
      <ol className="space-y-3 p-5 text-sm">
        {entries.map((e) => (
          <li key={e.id}>
            <span className="block font-semibold">{statusChange(e.summary.replace(/^[^:]+:\s*/, ""), a)}</span>
            <span className="text-xs text-muted">
              {formatDateTime(e.createdAt, locale)} · {e.actorEmail}
            </span>
          </li>
        ))}
        <li>
          <span className="block font-semibold">{a.order.placedEvent}</span>
          <span className="text-xs text-muted">{formatDateTime(createdAt, locale)}</span>
        </li>
      </ol>
    </Panel>
  );
}
