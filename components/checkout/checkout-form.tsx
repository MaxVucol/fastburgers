"use client";

import { SmartImage } from "@/components/ui/smart-image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, ArrowRight, Banknote, Bike, CreditCard, Loader2, Lock, ShoppingBag, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { placeOrder } from "@/actions/checkout";
import { checkoutProfileAction } from "@/actions/customer";
import { cartActions, lineLabel, lineUnitPrice, useCart, useHydrated } from "@/components/cart/cart-store";
import { BankDialog } from "@/components/checkout/bank-dialog";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatPrice } from "@/lib/format";
import { optionName } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { paymentBankName, type PaymentBank } from "@/lib/payment-banks";
import { computeDeliveryFee, FREE_DELIVERY_THRESHOLD, MIN_DELIVERY_ORDER } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validation/common";
import type { UnavailableItem } from "@/services/orders";
import type { PickupLocation } from "@/types/catalog";

type Delivery = "DELIVERY" | "PICKUP";
type CheckoutProfile = NonNullable<Awaited<ReturnType<typeof checkoutProfileAction>>>;

/** Random id for one checkout attempt (randomUUID needs a secure context; fall back otherwise). */
function newAttemptKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}
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
        "relative flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border-[1.5px] p-4 transition-colors duration-[var(--duration-fast)]",
        "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25",
        checked ? "border-ink bg-paper" : "border-line hover:border-ink/35",
        disabled && "cursor-not-allowed opacity-50 hover:border-line",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      <Icon className={cn("mt-0.5 size-5 shrink-0", checked ? "text-accent-ink" : "text-ink")} aria-hidden strokeWidth={1.8} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
      <span
        className={cn(
          "mt-1 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]",
          checked ? "border-ink" : "border-oat",
        )}
        aria-hidden
      >
        {checked && <span className="size-2 rounded-full bg-accent" />}
      </span>
    </label>
  );
}

function Step({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t-2 border-ink pt-5 md:grid-cols-[11rem_1fr] md:gap-8 md:pt-6">
      <h2 className="flex items-baseline gap-3 md:block">
        <span className="font-display text-[2.5rem] leading-none font-extrabold tracking-[-0.03em] text-accent-ink md:block md:text-5xl" aria-hidden>
          {String(step).padStart(2, "0")}
        </span>
        <span className="font-display text-xl font-extrabold tracking-[-0.02em] md:mt-2 md:block">{title}</span>
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function CheckoutForm({ locations }: { locations: PickupLocation[] }) {
  const { locale, t, href } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, subtotal } = useCart();
  const [delivery, setDelivery] = useState<Delivery>("DELIVERY");
  const [payment, setPayment] = useState<Payment>("CASH");
  // Card payment needs a bank: picking a card option opens the bank dialog first, and the option
  // becomes selected only after "Continue" (closing the dialog keeps the previous choice).
  const [bank, setBank] = useState<PaymentBank | null>(null);
  const [bankFor, setBankFor] = useState<Exclude<Payment, "CASH"> | null>(null);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Bumped when an error without a field to point at comes back: the message gets focus once rendered
  // (on phones it is far above the order button).
  const [errorFocus, setErrorFocus] = useState(0);

  useEffect(() => {
    if (errorFocus > 0) document.getElementById("checkout-error")?.focus();
  }, [errorFocus]);
  // What the server could no longer sell, kept so the customer can remove it in one click.
  const [unavailable, setUnavailable] = useState<UnavailableItem[]>([]);

  // Signed-in customers: fill the empty contact fields from the profile and offer saved addresses
  // (the order itself is tied to the account on the server, from the session).
  const [profile, setProfile] = useState<CheckoutProfile | null>(null);
  const formReady = hydrated && lines.length > 0;
  useEffect(() => {
    if (!formReady) return;
    let cancelled = false;
    checkoutProfileAction()
      .then((p) => {
        if (cancelled || !p) return;
        setProfile(p);
        for (const [id, value] of [["customerName", p.name], ["customerPhone", p.phone], ["customerEmail", p.email]] as const) {
          const input = document.getElementById(id) as HTMLInputElement | null;
          if (input && !input.value && value) input.value = value;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [formReady]);

  function fillSavedAddress(address: string) {
    const field = document.getElementById("deliveryAddress") as HTMLTextAreaElement | null;
    if (!field) return;
    field.value = address;
    field.focus();
  }

  // One id per checkout attempt, sent with the order: retrying the same attempt (lost answer, second
  // click, another tab) can only ever create one order. Any change to what is ordered — items,
  // quantities, prices (e.g. after "prices changed"), delivery or payment — starts a new attempt.
  const attemptKey = useRef<string | null>(null);
  const attemptSignature = JSON.stringify([
    lines.map((l) => [l.key, l.quantity, lineUnitPrice(l)]),
    delivery,
    delivery === "PICKUP" ? locationId : "",
    payment,
    payment === "CASH" ? "" : bank,
  ]);
  useEffect(() => {
    attemptKey.current = null;
  }, [attemptSignature]);

  const deliveryFee = computeDeliveryFee(delivery, subtotal);
  const total = subtotal + deliveryFee;
  const belowMinimum = delivery === "DELIVERY" && subtotal < MIN_DELIVERY_ORDER;
  const price = (value: number) => formatPrice(value, locale);

  if (!hydrated) {
    // Distinct keys: the empty state must be a new node, not the skeleton's <div> reused
    // (reuse is reported as a layout shift).
    return <div key="skeleton" className="h-[34rem] animate-pulse rounded-[var(--radius-panel)] bg-sand" aria-busy="true" aria-label={t.checkout.loading} />;
  }

  if (lines.length === 0) {
    return (
      <div key="empty" className="flex min-h-[34rem] flex-col items-center justify-center rounded-[var(--radius-panel)] border-[1.5px] border-dashed border-oat px-6 py-16 text-center">
        <ShoppingBag className="size-11 text-muted" aria-hidden strokeWidth={1.5} />
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.02em]">{t.checkout.emptyTitle}</h2>
        <p className="mt-2 max-w-sm text-muted">{t.checkout.emptyText}</p>
        <ButtonLink href={href("/menu")} size="lg" className="mt-7">
          {t.common.viewMenu}
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");

    setFormError(null);
    attemptKey.current ??= newAttemptKey();
    const idempotencyKey = attemptKey.current;
    startTransition(async () => {
      // A failed request (offline, server down) must not take the filled-in form away.
      const result = await placeOrder(
        {
          customerName: text("customerName"),
          customerPhone: text("customerPhone"),
          customerEmail: text("customerEmail"),
          deliveryMethod: delivery,
          deliveryAddress: delivery === "DELIVERY" ? text("deliveryAddress") : "",
          locationId: delivery === "PICKUP" ? locationId : "",
          paymentMethod: payment,
          paymentBank: payment === "CASH" ? undefined : (bank ?? undefined),
          notes: text("notes"),
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            optionIds: l.options.map((o) => o.id),
            unitPrice: lineUnitPrice(l),
          })),
          idempotencyKey,
        },
        locale,
      ).catch(() => ({ ok: false as const, error: t.errors.unexpected }));

      if (result.ok) {
        cartActions.clear();
        router.push(href(`/order/${result.data.number}?nou=1`));
        return;
      }
      if ("prices" in result && result.prices) cartActions.reprice(result.prices);
      const gone = "unavailable" in result ? (result.unavailable ?? []) : [];
      setUnavailable(gone);
      const fieldErrors = "fieldErrors" in result ? (result.fieldErrors ?? {}) : {};
      setErrors(fieldErrors);
      // Name what can no longer be ordered with the names the customer sees in the cart.
      const names = unavailableNames(gone);
      setFormError(names.length > 0 ? fill(t.checkout.unavailableItems, { items: names.join(", ") }) : result.error);
      // Move to the problem: the first invalid field, else the message.
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField) document.getElementById(firstField)?.focus();
      else setErrorFocus((n) => n + 1);
    });
  }

  function unavailableNames(items: UnavailableItem[]) {
    const names: string[] = [];
    for (const item of items) {
      for (const line of lines) {
        if (line.productId !== item.productId) continue;
        if (!item.optionId) {
          if (!names.includes(line.name)) names.push(line.name);
          continue;
        }
        const option = line.options.find((o) => o.id === item.optionId);
        const name = option && `${line.name} (+ ${optionName(option.name, t.options)})`;
        if (name && !names.includes(name)) names.push(name);
      }
    }
    return names;
  }

  function removeUnavailable() {
    cartActions.removeUnavailable(unavailable);
    setUnavailable([]);
    setFormError(null);
  }

  const err = (key: string) => errors[key];
  const invalid = (key: string) => (errors[key] ? true : undefined);
  const describedBy = (key: string) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-10 lg:grid-cols-[1fr_25rem] xl:grid-cols-[1fr_27rem] xl:gap-14">
      <div className="space-y-10">
        {formError && (
          <div id="checkout-error" role="alert" tabIndex={-1} className="flex items-start gap-3 rounded-[var(--radius-sm)] border-l-4 border-accent bg-accent-soft p-4 text-sm font-medium text-ink">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden />
            <div className="min-w-0">
              {formError}
              {unavailable.length > 0 && (
                <Button type="button" variant="outline" size="sm" className="mt-3 flex" onClick={removeUnavailable}>
                  {t.checkout.removeUnavailable}
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-muted">
          {profile ? (
            fill(t.me.checkout.signedInAs, { name: profile.name })
          ) : (
            <a href={href(`/account/login?next=${encodeURIComponent(href("/checkout"))}`)} className="font-semibold text-accent-ink underline-offset-4 hover:underline">
              {t.me.checkout.signInPrompt}
            </a>
          )}
        </p>

        <Step step={1} title={t.checkout.stepContact}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.checkout.name} htmlFor="customerName" error={err("customerName")} required className="sm:col-span-2">
              <Input id="customerName" name="customerName" autoComplete="name" required aria-invalid={invalid("customerName")} aria-describedby={describedBy("customerName")} />
            </Field>
            <Field label={t.checkout.phone} htmlFor="customerPhone" error={err("customerPhone")} hint={t.checkout.phoneHint} required>
              <Input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t.checkout.phonePlaceholder} required aria-invalid={invalid("customerPhone")} aria-describedby={describedBy("customerPhone")} />
            </Field>
            <Field label={t.checkout.email} htmlFor="customerEmail" error={err("customerEmail")} hint={t.checkout.emailHint} required>
              <Input id="customerEmail" name="customerEmail" type="email" autoComplete="email" placeholder={t.checkout.emailPlaceholder} required aria-invalid={invalid("customerEmail")} aria-describedby={describedBy("customerEmail")} />
            </Field>
          </div>
        </Step>

        <Step step={2} title={t.checkout.stepDelivery}>
          <fieldset>
            <legend className="sr-only">{t.checkout.deliveryMethod}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard name="deliveryMethod" value="DELIVERY" checked={delivery === "DELIVERY"} onChange={() => setDelivery("DELIVERY")} icon={Bike} title={t.checkout.deliveryTitle} description={fill(t.checkout.deliveryText, { amount: price(FREE_DELIVERY_THRESHOLD) })} />
              <ChoiceCard name="deliveryMethod" value="PICKUP" checked={delivery === "PICKUP"} onChange={() => setDelivery("PICKUP")} icon={Store} title={t.checkout.pickupTitle} description={t.checkout.pickupText} />
            </div>
          </fieldset>

          {delivery === "DELIVERY" && profile && profile.addresses.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">{t.me.checkout.savedAddresses}</p>
              <div className="flex flex-wrap gap-2">
                {profile.addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => fillSavedAddress(a.address)}
                    className="min-h-11 max-w-full rounded-full border-[1.5px] border-line px-4 py-2 text-left text-sm transition-colors hover:border-ink/35"
                  >
                    <span className="font-semibold">{a.label}</span>
                    <span className="block truncate text-xs text-muted sm:max-w-[22rem]">{a.address}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {delivery === "DELIVERY" ? (
            <Field label={t.checkout.address} htmlFor="deliveryAddress" error={err("deliveryAddress")} hint={t.checkout.addressHint} required className="mt-5">
              <Textarea id="deliveryAddress" name="deliveryAddress" autoComplete="street-address" rows={2} className="min-h-20" required aria-invalid={invalid("deliveryAddress")} aria-describedby={describedBy("deliveryAddress")} />
            </Field>
          ) : (
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold">{t.checkout.chooseRestaurant}</legend>
              <div className="grid gap-2" id="locationId" tabIndex={-1}>
                {locations.map((l) => (
                  <label
                    key={l.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border-[1.5px] p-3.5 transition-colors",
                      "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25",
                      locationId === l.id ? "border-ink bg-paper" : "border-line hover:border-ink/35",
                    )}
                  >
                    <input type="radio" name="locationId" value={l.id} checked={locationId === l.id} onChange={() => setLocationId(l.id)} className="mt-1 size-4 accent-ink" />
                    <span className="text-sm">
                      <span className="block font-semibold">{l.name}</span>
                      <span className="block text-muted">{l.address}</span>
                      <span className="block text-muted">{l.hours}</span>
                    </span>
                  </label>
                ))}
              </div>
              {err("locationId") && <p className="mt-2 text-sm font-medium text-accent-ink" role="alert">{err("locationId")}</p>}
            </fieldset>
          )}
        </Step>

        <Step step={3} title={t.checkout.stepPayment}>
          <fieldset>
            <legend className="sr-only">{t.checkout.paymentMethod}</legend>
            {/* Three across only while the form is full-width; beside the step label and the summary
                the cards get too narrow, so they stack like on phones. */}
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <ChoiceCard name="paymentMethod" value="CASH" checked={payment === "CASH"} onChange={() => setPayment("CASH")} icon={Banknote} title={t.checkout.cash} description={delivery === "DELIVERY" ? t.checkout.onDelivery : t.checkout.onPickup} />
              <ChoiceCard name="paymentMethod" value="CARD_ON_DELIVERY" checked={payment === "CARD_ON_DELIVERY"} onChange={() => setBankFor("CARD_ON_DELIVERY")} icon={CreditCard} title={delivery === "DELIVERY" ? t.checkout.card : t.checkout.cardPickup} description={delivery === "DELIVERY" ? t.checkout.courierPos : t.checkout.atCounter} />
              <ChoiceCard name="paymentMethod" value="CARD_ONLINE" checked={payment === "CARD_ONLINE"} onChange={() => setBankFor("CARD_ONLINE")} icon={Lock} title={t.checkout.online} description={t.checkout.onlineHint} />
            </div>
            {payment !== "CASH" && bank && (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm">
                <span className="text-muted">{t.checkout.bankLabel}:</span>
                <span className="font-semibold">{paymentBankName(bank, t.checkout.bankOther)}</span>
                <button type="button" onClick={() => setBankFor(payment)} className="font-semibold text-accent-ink underline underline-offset-4 hover:text-ink">
                  {t.checkout.bankChange}
                </button>
              </p>
            )}
            {err("paymentBank") && <p className="mt-2 text-sm font-medium text-accent-ink" role="alert">{err("paymentBank")}</p>}
          </fieldset>
          {bankFor && (
            <BankDialog
              initial={bank}
              onConfirm={(chosen) => {
                setBank(chosen);
                setPayment(bankFor);
              }}
              onClose={() => setBankFor(null)}
            />
          )}
          <Field label={t.checkout.notes} htmlFor="notes" error={err("notes")} hint={t.checkout.notesHint} className="mt-5">
            <Textarea id="notes" name="notes" maxLength={500} aria-invalid={invalid("notes")} />
          </Field>
        </Step>
      </div>

      <aside
        className="overflow-hidden rounded-[var(--radius-panel)] bg-graphite text-on-dark lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]"
        aria-labelledby="summary-title"
      >
        <h2 id="summary-title" className="border-b border-line-dark px-5 py-4 font-display text-2xl font-extrabold tracking-[-0.02em] sm:px-6">
          {t.checkout.summary}
        </h2>
        <ul className="max-h-[22rem] divide-y divide-line-dark overflow-y-auto px-5 sm:px-6">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3.5 py-4">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-graphite">
                <SmartImage src={line.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight font-semibold">{line.name}</p>
                {line.options.length > 0 && (
                  <p className="text-xs text-muted-on-dark">+ {line.options.map((o) => optionName(o.name, t.options)).join(", ")}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <QuantityStepper size="sm" tone="dark" min={0} value={line.quantity} label={lineLabel(line, (n) => optionName(n, t.options))} onChange={(q) => cartActions.setQuantity(line.key, q)} />
                  <span className="text-sm font-semibold tabular-nums">{price(lineUnitPrice(line) * line.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-2.5 border-t border-line-dark px-5 py-5 text-sm sm:px-6">
          <div className="flex justify-between">
            <dt className="text-muted-on-dark">{t.common.subtotal}</dt>
            <dd className="font-semibold tabular-nums">{price(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-on-dark">{delivery === "DELIVERY" ? t.checkout.delivery : t.checkout.pickup}</dt>
            <dd className="font-semibold tabular-nums">{deliveryFee === 0 ? t.common.free : price(deliveryFee)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line-dark pt-4">
            <dt className="text-base font-semibold">{t.common.total}</dt>
            <dd className="font-display text-[2rem] leading-none font-semibold text-flame tabular-nums">{price(total)}</dd>
          </div>
        </dl>
        <div className="px-5 pb-6 sm:px-6">
          {belowMinimum && (
            <p className="mb-4 rounded-[var(--radius-sm)] bg-graphite-soft px-3.5 py-3 text-sm text-on-dark" role="status">
              {fill(t.checkout.minimum, { min: price(MIN_DELIVERY_ORDER), left: price(MIN_DELIVERY_ORDER - subtotal) })}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full whitespace-normal" disabled={isPending || belowMinimum}>
            {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4.5" aria-hidden />}
            {isPending ? t.checkout.submitting : fill(t.checkout.submit, { total: price(total) })}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-on-dark">{t.checkout.priceNote}</p>
          {/* BUNIQ is a design concept: say so where it matters most, right under the order button. */}
          <p className="mt-2 text-center text-xs text-flame">{t.checkout.demo}</p>
        </div>
      </aside>
    </form>
  );
}
