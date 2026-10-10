import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, CircleX, MapPin } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { Crown } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";
import { optionName } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { getOrderForTracking } from "@/services/orders";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.orderTitle, robots: { index: false, follow: false } };
}

export default function OrderPage({ params, searchParams }: PageProps<"/[lang]/order/[number]">) {
  return (
    <div className="container-page max-w-4xl pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Suspense fallback={<div className="h-[30rem] animate-pulse rounded-[var(--radius-panel)] bg-sand" aria-busy="true" />}>
        <OrderDetails params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function stepsFor(method: "DELIVERY" | "PICKUP"): OrderStatus[] {
  return method === "DELIVERY"
    ? ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"]
    : ["NEW", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];
}

async function OrderDetails({
  params,
  searchParams,
}: Pick<PageProps<"/[lang]/order/[number]">, "params" | "searchParams">) {
  const [{ number }, query, { locale, t, href }] = await Promise.all([params, searchParams, getI18n()]);
  if (!/^FB-[A-Z0-9]{6,10}$/.test(number)) notFound();
  const order = await getOrderForTracking(number);
  if (!order) notFound();

  const justPlaced = query.nou === "1";
  const cancelled = order.status === "CANCELLED";
  const steps = stepsFor(order.deliveryMethod);
  const currentIndex = steps.indexOf(
    order.status === "READY" && order.deliveryMethod === "DELIVERY" ? "PREPARING" : order.status,
  );
  const isFinal = order.status === "COMPLETED" || cancelled;
  const firstName = order.customerName.split(" ")[0] ?? "";
  const price = (value: number) => formatPrice(value, locale);

  return (
    <>
      {!isFinal && <AutoRefresh />}
      <header>
        <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
          <Crown className="h-3.5 text-accent-ink" />
          {t.order.number} {order.number}
        </p>
        <h1 className="type-h1 mt-4">
          {justPlaced ? fill(t.order.thanks, { name: firstName }) : fill(t.order.title, { number: order.number })}
        </h1>
        <p className="mt-3 text-muted">{fill(t.order.placed, { date: formatDateTime(order.createdAt, locale) })}</p>
      </header>

      <section aria-labelledby="status-title" className="mt-10 rounded-[var(--radius-panel)] bg-ink p-6 text-on-dark sm:p-8">
        <h2 id="status-title" className="sr-only">{t.order.status}</h2>
        {cancelled ? (
          <p className="flex items-center gap-3 font-semibold">
            <CircleX className="size-6 text-flame" aria-hidden /> {t.order.cancelled}
          </p>
        ) : (
          <ol className="grid gap-5 sm:grid-cols-5 sm:gap-3" aria-label={t.order.steps}>
            {steps.map((step, i) => {
              const done = i <= currentIndex;
              const current = i === currentIndex;
              return (
                <li
                  key={step}
                  className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3"
                  aria-current={current ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                      done ? "bg-accent text-ink" : "border-[1.5px] border-line-dark text-muted-on-dark",
                      current && "ring-4 ring-accent/30",
                    )}
                  >
                    {done ? <Check className="size-4.5" aria-hidden strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("text-sm", current ? "font-semibold text-on-dark" : done ? "text-on-dark/85" : "text-muted-on-dark")}>
                    {t.order.statuses[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {!isFinal && <p className="mt-6 text-xs text-muted-on-dark">{t.order.autoRefresh}</p>}
      </section>

      <section aria-labelledby="items-title" className="mt-10">
        <h2 id="items-title" className="type-eyebrow border-b-2 border-ink pb-3 text-ink">{t.order.items}</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-sand">
                <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight font-semibold">
                  <span className="tabular-nums">{item.quantity} ×</span> {item.productName}
                </p>
                {item.options.length > 0 && (
                  <p className="text-xs text-muted">+ {item.options.map((o) => optionName(o.name, t.options)).join(", ")}</p>
                )}
              </div>
              <span className="font-semibold tabular-nums">{price(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t.common.subtotal}</dt>
            <dd className="tabular-nums">{price(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t.order.delivery}</dt>
            <dd className="tabular-nums">{order.deliveryFee ? price(order.deliveryFee) : t.common.free}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="text-base font-semibold">{t.common.total}</dt>
            <dd className="font-display text-3xl leading-none font-semibold tabular-nums">{price(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line text-sm sm:grid-cols-2">
        <div className="bg-ivory p-5">
          <h2 className="font-sans text-base font-semibold tracking-normal">{t.order.methods[order.deliveryMethod]}</h2>
          {order.location ? (
            <p className="mt-2 flex gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
              {order.location.name}, {order.location.address}
            </p>
          ) : (
            <p className="mt-2 text-muted">{t.order.courier}</p>
          )}
        </div>
        <div className="bg-ivory p-5">
          <h2 className="font-sans text-base font-semibold tracking-normal">{t.order.payment}</h2>
          <p className="mt-2 text-muted">{t.order.payments[order.paymentMethod]}</p>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 min-[420px]:flex-row">
        <ButtonLink href={href("/menu")} size="lg">{t.order.again}</ButtonLink>
        <ButtonLink href={href("/")} size="lg" variant="outline">{t.order.home}</ButtonLink>
      </div>
    </>
  );
}
