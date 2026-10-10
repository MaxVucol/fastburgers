import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import type { Metadata } from "next";
import { defaultLocale, isLocale, locales, localizePath, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

// Server-side access to the current language. `lang` is the root route parameter
// (app/[lang]), so any Server Component can read it without prop drilling.

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: getDictionary(locale),
    href: (path: string) => localizePath(locale, path),
  };
}

/** canonical + hreflang alternates for a locale-independent path such as "/menu". */
export function localeAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizePath(l, path);
  languages["x-default"] = localizePath(defaultLocale, path);
  return { canonical: localizePath(locale, path), languages };
}
