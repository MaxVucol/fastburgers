import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OrderStatusPill } from "@/components/account/order-bits";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { optionName } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getUserOrder } from "@/services/customer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.orders.title, robots: { index: false, follow: false } };
}

export default function AccountOrderPage({ params }: PageProps<"/[lang]/account/orders/[number]">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/[lang]/account/orders/[number]">, "params">) {
  const [{ number }, { locale, t, href }] = await Promise.all([params, getI18n()]);
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href(`/account/orders/${number}`))}`));
  // Scoped by the session user: another customer's order number simply is not found.
  const order = await getUserOrder(user.id, number);
  if (!order) notFound();
  const price = (v: number) => formatPrice(v, locale);

  return (
    <AccountShell user={user} active="orders" title={fill(t.me.order.title, { number: order.number })} lead={fill(t.me.order.placed, { date: formatDateTime(order.createdAt, locale) })}>
      <Link href={href("/account/orders")} className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        {t.me.order.back}
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <AccountPanel title={t.me.order.items}>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-3.5">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-sand">
                  {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.productName}</p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-muted">+ {item.options.map((o) => optionName(o.name, t.options)).join(", ")}</p>
                  )}
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    {item.quantity} × {price(item.price)}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{price(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t.common.subtotal}</dt>
              <dd className="font-semibold tabular-nums">{price(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{order.deliveryMethod === "DELIVERY" ? t.checkout.delivery : t.checkout.pickup}</dt>
              <dd className="font-semibold tabular-nums">{order.deliveryFee === 0 ? t.common.free : price(order.deliveryFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">{t.common.total}</dt>
              <dd className="font-display text-2xl font-semibold text-accent-ink tabular-nums">{price(order.total)}</dd>
            </div>
          </dl>
        </AccountPanel>

        <AccountPanel>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">{t.order.status}</dt>
              <dd className="mt-1">
                <OrderStatusPill status={order.status} label={t.order.statuses[order.status]} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t.me.order.method}</dt>
              <dd className="mt-0.5 font-semibold">{t.order.methods[order.deliveryMethod]}</dd>
            </div>
            {order.deliveryMethod === "DELIVERY" ? (
              <div>
                <dt className="text-muted">{t.me.order.address}</dt>
                <dd className="mt-0.5 break-words">{order.deliveryAddress}</dd>
              </div>
            ) : (
              order.location && (
                <div>
                  <dt className="text-muted">{t.me.order.restaurant}</dt>
                  <dd className="mt-0.5">
                    <span className="block font-semibold">{order.location.name}</span>
                    {order.location.address}
                  </dd>
                </div>
              )
            )}
            <div>
              <dt className="text-muted">{t.me.order.payment}</dt>
              <dd className="mt-0.5">{t.order.payments[order.paymentMethod]}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-muted">{t.me.order.notes}</dt>
                <dd className="mt-0.5 break-words">{order.notes}</dd>
              </div>
            )}
          </dl>
          <Link href={href(`/order/${order.number}`)} className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-ink hover:underline">
            {t.me.order.track}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </AccountPanel>
      </div>
    </AccountShell>
  );
}
