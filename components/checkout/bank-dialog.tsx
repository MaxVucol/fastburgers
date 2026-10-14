"use client";

import { useEffect, useRef, useState } from "react";
import { Landmark, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { PAYMENT_BANKS, paymentBankName, type PaymentBank } from "@/lib/payment-banks";
import { cn } from "@/lib/utils";

/**
 * Small modal shown when the customer picks card payment (to the courier or online): one bank per
 * row and "Continue". Mounted only while needed; it opens itself and reports the choice, or
 * `onClose` without one (Esc, the close button or a click on the backdrop), which keeps the
 * previous payment method.
 */
export function BankDialog({
  initial,
  onConfirm,
  onClose,
}: {
  initial: PaymentBank | null;
  onConfirm: (bank: PaymentBank) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<PaymentBank | null>(initial);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="bank-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="sheet m-auto w-[calc(100%-2rem)] max-w-md rounded-[var(--radius-panel)] bg-cream p-0 shadow-[var(--shadow-lift)] dark:border dark:border-line dark:bg-paper"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="bank-dialog-title" className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.75rem]">
            {t.checkout.bankTitle}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={t.checkout.bankClose}
            className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-sand"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="sr-only">{t.checkout.bankTitle}</legend>
          <div className="grid gap-2.5">
            {PAYMENT_BANKS.map((bank) => {
              const checked = choice === bank;
              const name = paymentBankName(bank, t.checkout.bankOther);
              return (
                <label
                  key={bank}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border-[1.5px] px-4 transition-colors duration-[var(--duration-fast)]",
                    "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25",
                    checked ? "border-ink bg-paper dark:bg-sand" : "border-line bg-ivory hover:border-ink/35 dark:bg-paper",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentBank"
                    value={bank}
                    checked={checked}
                    onChange={() => setChoice(bank)}
                    className="sr-only"
                  />
                  {bank === "other" && <Landmark className="size-5 shrink-0" aria-hidden strokeWidth={1.8} />}
                  <span
                    className={cn(
                      bank === "maib" ? "font-display text-xl font-extrabold tracking-[-0.03em]" : "font-semibold",
                      bank === "micb" && "tracking-[0.04em] uppercase",
                    )}
                  >
                    {name}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button
          size="lg"
          className="mt-6 w-full"
          disabled={!choice}
          onClick={() => {
            if (!choice) return;
            onConfirm(choice);
            ref.current?.close();
          }}
        >
          {t.checkout.bankContinue}
        </Button>
      </div>
    </dialog>
  );
}
