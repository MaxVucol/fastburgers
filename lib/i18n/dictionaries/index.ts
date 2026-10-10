import { catalogCopy } from "../catalog-translations";
import type { Locale } from "../config";
import { en } from "./en";
import { ro, type Dictionary } from "./ro";
import { ru } from "./ru";

export type { Dictionary };

const base: Record<Locale, Dictionary> = { ro, ru, en };

// Option names travel with cart lines and order snapshots in Romanian, so Client Components
// translate them on render; the (small) map is merged into the dictionary they receive.
const dictionaries: Record<Locale, Dictionary> = {
  ro,
  ru: { ...base.ru, options: catalogCopy.ru.options },
  en: { ...base.en, options: catalogCopy.en.options },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
