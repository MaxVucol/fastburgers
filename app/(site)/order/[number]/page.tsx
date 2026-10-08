import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, CircleX, MapPin, PartyPopper } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DELIVERY_METHOD_LABEL, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { getOrderForTracking } from "@/services/orders";

export const metadata: Metadata = {
  title: "Comanda ta",
  robots: { index: false, follow: false },
};

export default function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Suspense fallback={<div className="h-[28rem] animate-pulse rounded-2xl bg-sand" aria-busy="true" />}>
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
}: Pick<PageProps<"/order/[number]">, "params" | "searchParams">) {
  const [{ number }, query] = await Promise.all([params, searchParams]);
  if (!/^FB-[A-Z0-9]{6,10}$/.test(number)) notFound();
  const order = await getOrderForTracking(number);
  if (!order) notFound();

  const justPlaced = query.nou === "1";
  const cancelled = order.status === "CANCELLED";
  const steps = stepsFor(order.deliveryMethod);
  const currentIndex = steps.indexOf(order.status === "READY" && order.deliveryMethod === "DELIVERY" ? "PREPARING" : order.status);
  const isFinal = order.status === "COMPLETED" || cancelled;
  const firstName = order.customerName.split(" ")[0];

  return (
    <>
      {!isFinal && <AutoRefresh />}
      <header className="text-center">
        {justPlaced ? (
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-herb-soft text-herb">
            <PartyPopper className="size-8" aria-hidden />
          </span>
        ) : null}
        <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">
          {justPlaced ? `Mulțumim, ${firstName}! Comanda a fost trimisă.` : `Comanda ${order.number}`}
        </h1>
        <p className="mt-2 text-muted">
          Număr comandă <strong className="text-ink">{order.number}</strong> · plasată{" "}
          {formatDateTime(order.createdAt)}
        </p>
      </header>

      <section aria-labelledby="status-title" className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
        <h2 id="status-title" className="sr-only">Status comandă</h2>
        {cancelled ? (
          <p className="flex items-center gap-3 font-semibold text-accent">
            <CircleX className="size-6" aria-hidden /> Comanda a fost anulată. Pentru detalii, sună-ne.
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-5 sm:gap-2" aria-label="Etapele comenzii">
            {steps.map((step, i) => {
              const done = i <= currentIndex;
              const current = i === currentIndex;
              return (
                <li key={step} className="flex items-center gap-3 sm:flex-col sm:text-center" aria-current={current ? "step" : undefined}>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                      done ? "bg-herb text-white" : "bg-sand text-muted",
                      current && "ring-4 ring-herb/20",
                    )}
                  >
                    {done ? <Check className="size-4.5" aria-hidden /> : i + 1}
                  </span>
                  <span className={cn("text-sm", current ? "font-bold text-ink" : done ? "text-ink-soft" : "text-muted")}>
                    {ORDER_STATUS_LABEL[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {!isFinal && (
          <p className="mt-5 text-center text-xs text-muted">Pagina se actualizează automat.</p>
        )}
      </section>

      <section aria-labelledby="items-title" className="mt-6 rounded-2xl bg-white ring-1 ring-line">
        <h2 id="items-title" className="border-b border-line px-5 py-4 text-lg font-extrabold">Produse</h2>
        <ul className="divide-y divide-line px-5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3.5">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {item.quantity} × {item.productName}
                </p>
                {item.options.length > 0 && (
                  <p className="text-xs text-muted">+ {item.options.map((o) => o.name).join(", ")}</p>
                )}
              </div>
              <span className="font-semibold tabular-nums">{formatPrice(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Livrare</dt>
            <dd className="tabular-nums">{order.deliveryFee ? formatPrice(order.deliveryFee) : "Gratuit"}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-extrabold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">{DELIVERY_METHOD_LABEL[order.deliveryMethod]}</h2>
          {order.location ? (
            <p className="mt-2 flex gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {order.location.name}, {order.location.address}
            </p>
          ) : (
            <p className="mt-2 text-muted">Curierul te sună când ajunge.</p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Plată</h2>
          <p className="mt-2 text-muted">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 min-[400px]:flex-row">
        <ButtonLink href="/menu" variant="dark">Comandă din nou</ButtonLink>
        <ButtonLink href="/" variant="outline">Înapoi acasă</ButtonLink>
      </div>
    </>
  );
}
