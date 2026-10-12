import { intlLocale, type Locale } from "@/lib/i18n/config";

const CURRENCY: Record<Locale, string> = { ro: "lei", ru: "лей", en: "lei" };

const priceFormatters = new Map<Locale, Intl.NumberFormat>();
function priceFormatter(locale: Locale) {
  let formatter = priceFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    priceFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Formats a price stored in bani (1/100 MDL, Moldovan leu): "32,90 lei", "32,90 лей", "32.90 lei". */
export function formatPrice(bani: number, locale: Locale = "ro"): string {
  return `${priceFormatter(locale).format(bani / 100)} ${CURRENCY[locale]}`;
}

/** Converts a user-entered "32,90" / "32.90" into bani. Returns NaN on invalid input. */
export function parsePriceToBani(value: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number.parseFloat(normalized) * 100);
}

export function baniToInput(bani: number | null | undefined): string {
  if (bani == null) return "";
  return (bani / 100).toFixed(2);
}

export function formatDate(date: Date, locale: Locale = "ro"): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date, locale: Locale = "ro"): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  }).format(date);
}

export function formatNumber(value: number, locale: Locale = "ro", maximumFractionDigits = 1): string {
  return value.toLocaleString(intlLocale[locale], { maximumFractionDigits });
}

export function discountPercent(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
