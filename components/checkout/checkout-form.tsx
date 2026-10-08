"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Banknote, Bike, CreditCard, Loader2, Lock, ShoppingBag, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { placeOrder } from "@/actions/checkout";
import { cartActions, lineUnitPrice, useCart, useHydrated } from "@/components/cart/cart-store";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatPrice } from "@/lib/format";
import { computeDeliveryFee, FREE_DELIVERY_THRESHOLD, MIN_DELIVERY_ORDER } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validation/common";
import type { PickupLocation } from "@/types/catalog";

type Delivery = "DELIVERY" | "PICKUP";
type Payment = "CASH" | "CARD_ON_DELIVERY" | "CARD_ONLINE";

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  icon: Icon,
  title,
  description,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/15",
        checked ? "border-accent bg-accent-soft/40" : "border-line hover:border-ink/20",
        disabled && "cursor-not-allowed opacity-55 hover:border-line",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          checked ? "bg-accent text-white" : "bg-sand text-ink",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}

function SectionTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-xl font-extrabold">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-sm text-white">{step}</span>
      {children}
    </h2>
  );
}

export function CheckoutForm({ locations }: { locations: PickupLocation[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, subtotal } = useCart();
  const [delivery, setDelivery] = useState<Delivery>("DELIVERY");
  const [payment, setPayment] = useState<Payment>("CASH");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deliveryFee = computeDeliveryFee(delivery, subtotal);
  const total = subtotal + deliveryFee;
  const belowMinimum = delivery === "DELIVERY" && subtotal < MIN_DELIVERY_ORDER;

  if (!hydrated) {
    return <div className="h-[32rem] animate-pulse rounded-2xl bg-sand" aria-busy="true" aria-label="Se încarcă coșul" />;
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[32rem] flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
        <ShoppingBag className="size-12 text-muted" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">Coșul tău este gol</h2>
        <p className="mt-2 max-w-sm text-muted">Adaugă produse din meniu și revino aici pentru a finaliza comanda.</p>
        <ButtonLink href="/menu" size="lg" className="mt-6">
          Vezi meniul
        </ButtonLink>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");

    setFormError(null);
    startTransition(async () => {
      const result = await placeOrder({
        customerName: text("customerName"),
        customerPhone: text("customerPhone"),
        customerEmail: text("customerEmail"),
        deliveryMethod: delivery,
        deliveryAddress: delivery === "DELIVERY" ? text("deliveryAddress") : "",
        locationId: delivery === "PICKUP" ? locationId : "",
        paymentMethod: payment,
        notes: text("notes"),
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          optionIds: l.options.map((o) => o.id),
        })),
      });

      if (result.ok) {
        cartActions.clear();
        router.push(`/order/${result.data.number}?nou=1`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      const firstField = Object.keys(result.fieldErrors ?? {})[0];
      if (firstField) document.getElementById(firstField)?.focus();
    });
  }

  const err = (key: string) => errors[key];
  const invalid = (key: string) => (errors[key] ? true : undefined);
  const describedBy = (key: string) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_26rem]">
      <div className="space-y-6">
        {formError && (
          <div role="alert" className="flex items-start gap-3 rounded-xl bg-accent-soft p-4 text-sm font-medium text-accent-hover">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            {formError}
          </div>
        )}

        <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <SectionTitle step={1}>Datele tale</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume complet" htmlFor="customerName" error={err("customerName")} required className="sm:col-span-2">
              <Input id="customerName" name="customerName" autoComplete="name" required aria-invalid={invalid("customerName")} aria-describedby={describedBy("customerName")} />
            </Field>
            <Field label="Telefon" htmlFor="customerPhone" error={err("customerPhone")} hint="Te sunăm doar dacă e nevoie." required>
              <Input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx" required aria-invalid={invalid("customerPhone")} aria-describedby={describedBy("customerPhone")} />
            </Field>
            <Field label="Email" htmlFor="customerEmail" error={err("customerEmail")} hint="Pentru confirmarea comenzii." required>
              <Input id="customerEmail" name="customerEmail" type="email" autoComplete="email" placeholder="nume@exemplu.ro" required aria-invalid={invalid("customerEmail")} aria-describedby={describedBy("customerEmail")} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <SectionTitle step={2}>Livrare</SectionTitle>
          <fieldset>
            <legend className="sr-only">Metoda de livrare</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard name="deliveryMethod" value="DELIVERY" checked={delivery === "DELIVERY"} onChange={() => setDelivery("DELIVERY")} icon={Bike} title="Livrare la domiciliu" description={`~30 min · gratuit peste ${formatPrice(FREE_DELIVERY_THRESHOLD)}`} />
              <ChoiceCard name="deliveryMethod" value="PICKUP" checked={delivery === "PICKUP"} onChange={() => setDelivery("PICKUP")} icon={Store} title="Ridicare din restaurant" description="Gata în ~15 min · fără taxă" />
            </div>
          </fieldset>

          {delivery === "DELIVERY" ? (
            <Field label="Adresa de livrare" htmlFor="deliveryAddress" error={err("deliveryAddress")} hint="Stradă, număr, bloc, scară, etaj, apartament, interfon." required className="mt-5">
              <Textarea id="deliveryAddress" name="deliveryAddress" autoComplete="street-address" rows={2} className="min-h-20" required aria-invalid={invalid("deliveryAddress")} aria-describedby={describedBy("deliveryAddress")} />
            </Field>
          ) : (
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-ink-soft">Alege restaurantul</legend>
              <div className="grid gap-2" id="locationId" tabIndex={-1}>
                {locations.map((l) => (
                  <label
                    key={l.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                      locationId === l.id ? "border-accent bg-accent-soft/40" : "border-line hover:border-ink/20",
                    )}
                  >
                    <input type="radio" name="locationId" value={l.id} checked={locationId === l.id} onChange={() => setLocationId(l.id)} className="mt-1 size-4 accent-accent" />
                    <span className="text-sm">
                      <span className="block font-bold">{l.name}</span>
                      <span className="block text-muted">{l.address}</span>
                      <span className="block text-muted">{l.hours}</span>
                    </span>
                  </label>
                ))}
              </div>
              {err("locationId") && <p className="mt-2 text-sm font-medium text-accent" role="alert">{err("locationId")}</p>}
            </fieldset>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <SectionTitle step={3}>Plată</SectionTitle>
          <fieldset>
            <legend className="sr-only">Metoda de plată</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <ChoiceCard name="paymentMethod" value="CASH" checked={payment === "CASH"} onChange={() => setPayment("CASH")} icon={Banknote} title="Numerar" description={delivery === "DELIVERY" ? "La livrare" : "La ridicare"} />
              <ChoiceCard name="paymentMethod" value="CARD_ON_DELIVERY" checked={payment === "CARD_ON_DELIVERY"} onChange={() => setPayment("CARD_ON_DELIVERY")} icon={CreditCard} title="Card (POS)" description={delivery === "DELIVERY" ? "Curierul are POS" : "La casă"} />
              <ChoiceCard name="paymentMethod" value="CARD_ONLINE" checked={payment === "CARD_ONLINE"} onChange={() => setPayment("CARD_ONLINE")} icon={Lock} title="Card online" description="În curând" disabled />
            </div>
          </fieldset>
          <Field label="Observații pentru comandă" htmlFor="notes" error={err("notes")} hint="Ex.: fără ceapă, băutura preferată pentru combo, sună la interfon 14." className="mt-5">
            <Textarea id="notes" name="notes" maxLength={500} aria-invalid={invalid("notes")} />
          </Field>
        </section>
      </div>

      <aside className="rounded-2xl bg-white ring-1 ring-line lg:sticky lg:top-24" aria-labelledby="summary-title">
        <h2 id="summary-title" className="border-b border-line px-5 py-4 text-xl font-extrabold">
          Sumar comandă
        </h2>
        <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto px-5">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3 py-3.5">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-tight font-bold">{line.name}</p>
                {line.options.length > 0 && (
                  <p className="text-xs text-muted">+ {line.options.map((o) => o.name).join(", ")}</p>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <QuantityStepper size="sm" min={0} value={line.quantity} label={line.name} onChange={(q) => cartActions.setQuantity(line.key, q)} />
                  <span className="text-sm font-bold tabular-nums">{formatPrice(lineUnitPrice(line) * line.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{delivery === "DELIVERY" ? "Livrare" : "Ridicare"}</dt>
            <dd className={cn("font-semibold tabular-nums", deliveryFee === 0 && "text-herb")}>
              {deliveryFee === 0 ? "Gratuit" : formatPrice(deliveryFee)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="text-base font-bold">Total</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
        <div className="px-5 pb-5">
          {belowMinimum && (
            <p className="mb-3 rounded-lg bg-mustard-soft px-3 py-2 text-sm text-[#7a4f00]" role="status">
              Comanda minimă pentru livrare este {formatPrice(MIN_DELIVERY_ORDER)}. Mai adaugă{" "}
              {formatPrice(MIN_DELIVERY_ORDER - subtotal)} sau alege ridicarea.
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={isPending || belowMinimum}>
            {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4.5" aria-hidden />}
            {isPending ? "Se trimite comanda…" : `Plasează comanda · ${formatPrice(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            Prețurile sunt verificate din nou la plasarea comenzii.
          </p>
        </div>
      </aside>
    </form>
  );
}
