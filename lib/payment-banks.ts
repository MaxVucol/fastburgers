/**
 * Banks offered for card payment (to the courier or online). The choice is stored with the order so
 * the staff know which terminal or payment link to prepare; nothing is charged on the site.
 */
export const PAYMENT_BANKS = ["maib", "micb", "victoriabank", "other"] as const;
export type PaymentBank = (typeof PAYMENT_BANKS)[number];

const NAMES: Record<Exclude<PaymentBank, "other">, string> = {
  maib: "maib",
  micb: "Moldindconbank",
  victoriabank: "Victoriabank",
};

export function isPaymentBank(value: unknown): value is PaymentBank {
  return typeof value === "string" && (PAYMENT_BANKS as readonly string[]).includes(value);
}

/** Display name; "other" (or an unknown stored value) uses the caller's localized label. */
export function paymentBankName(bank: string | null | undefined, otherLabel: string): string | null {
  if (!bank) return null;
  return bank in NAMES ? NAMES[bank as keyof typeof NAMES] : otherLabel;
}
