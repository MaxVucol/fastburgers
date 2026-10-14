import { fill, intlLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { adminEn } from "./en";
import { adminRo, type AdminDictionary } from "./ro";
import { adminRu } from "./ru";

/**
 * Language of the admin panel: chosen with the switcher in the panel and kept in its own cookie,
 * independent of the public site's language. Romanian unless chosen otherwise.
 */
export const ADMIN_LOCALE_COOKIE = "fb-admin-lang";
export const DEFAULT_ADMIN_LOCALE: Locale = "ro";

export const adminDictionaries: Record<Locale, AdminDictionary> = { ro: adminRo, ru: adminRu, en: adminEn };

export function resolveAdminLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_ADMIN_LOCALE;
}

export { intlLocale };
export type { AdminDictionary };

const ROW = /^Rândul (\d+): ([\s\S]*)$/;
const MISSING = /^Lipsesc coloanele: (.*)$/;
const UNKNOWN_PRODUCT = /^produsul BUNIQ „(.*)” nu există\.$/;
const PRICE_MOVED = /^Prețul s-a schimbat între timp \(acum (.+)\)\. Verifică din nou\.$/;

/**
 * Translates a message produced in Romanian by shared validation, services or uploads (exact
 * texts in `a.messages`, plus the line-numbered CSV import messages). Unknown text is returned as
 * it is, so nothing is ever hidden.
 */
export function translateAdminMessage(a: AdminDictionary, message: string): string {
  if (a === adminRo || !message) return message;
  const exact = a.messages[message];
  if (exact) return exact;
  const row = ROW.exec(message);
  if (row) {
    const parts = row[2].split("; ").map((part) => translateAdminMessage(a, part));
    return fill(a.csv.row, { line: row[1], message: parts.join("; ") });
  }
  const missing = MISSING.exec(message);
  if (missing) return fill(a.csv.missingColumns, { columns: missing[1] });
  const unknown = UNKNOWN_PRODUCT.exec(message);
  if (unknown) return fill(a.csv.unknownProduct, { slug: unknown[1] });
  const moved = PRICE_MOVED.exec(message);
  if (moved) return fill(a.csv.priceMovedTo, { price: moved[1] });
  return message;
}

/** Field errors from shared validation, translated for the panel. */
export function translateFieldErrors<T extends Partial<Record<string, string>>>(a: AdminDictionary, errors: T): T {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v ? translateAdminMessage(a, v) : v])) as T;
}
