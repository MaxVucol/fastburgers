// Locale routing shared by proxy.ts, server and client code (no server-only imports here).
//
// URLs: Romanian is the default and has no prefix (/menu), the other languages are
// prefixed (/ru/menu, /en/menu). proxy.ts rewrites unprefixed URLs to /ro/… internally,
// so every page lives under app/[lang] and can be prerendered per language.

export const locales = ["ro", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ro";

/** Remembers an explicit language choice (set by the language switcher). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, { short: string; native: string }> = {
  ro: { short: "RO", native: "Română" },
  ru: { short: "RU", native: "Русский" },
  en: { short: "EN", native: "English" },
};

/** BCP 47 tags for Intl formatting and <html lang>. */
export const intlLocale: Record<Locale, string> = { ro: "ro-RO", ru: "ru-RU", en: "en-GB" };
export const ogLocale: Record<Locale, string> = { ro: "ro_RO", ru: "ru_RU", en: "en_GB" };

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/** "/menu" → "/menu" (ro), "/ru/menu", "/en/menu". Keeps query strings and hashes. */
export function localizePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return normalized;
  if (normalized === "/") return `/${locale}`;
  if (normalized.startsWith("/?") || normalized.startsWith("/#")) return `/${locale}${normalized.slice(1)}`;
  return `/${locale}${normalized}`;
}

/** Splits a browser pathname into its locale and the locale-independent path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const segment = pathname.split("/")[1];
  if (isLocale(segment) && segment !== defaultLocale) {
    const rest = pathname.slice(segment.length + 1);
    return { locale: segment, path: rest || "/" };
  }
  if (segment === defaultLocale) {
    const rest = pathname.slice(segment.length + 1);
    return { locale: defaultLocale, path: rest || "/" };
  }
  return { locale: defaultLocale, path: pathname || "/" };
}

/** Replaces {name} placeholders. Dictionaries stay plain strings so they can reach Client Components. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type PluralForms = { one: string; few?: string; many?: string; other: string };

const pluralRules = new Map<Locale, Intl.PluralRules>();

/** Picks the plural form for `count` ("1 produs" / "2 продукта" / "5 products") and fills {count}. */
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(intlLocale[locale]);
    pluralRules.set(locale, rules);
  }
  const category = rules.select(count);
  const form =
    (category === "one" && forms.one) ||
    (category === "few" && forms.few) ||
    (category === "many" && forms.many) ||
    forms.other;
  return fill(form, { count });
}
