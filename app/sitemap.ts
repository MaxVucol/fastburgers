import type { MetadataRoute } from "next";
import { locales, localizePath } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/site";
import { getCategories, getMenuProducts } from "@/services/catalog";

type Entry = MetadataRoute.Sitemap[number];

/** One entry per language, each listing its translations (hreflang). */
function localized(path: string, extra: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(localizePath(l, path))]));
  return locales.map((l) => ({ url: absoluteUrl(localizePath(l, path)), alternates: { languages }, ...extra }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getMenuProducts()]);

  return [
    ...localized("/", { changeFrequency: "daily", priority: 1 }),
    ...localized("/menu", { changeFrequency: "daily", priority: 0.9 }),
    ...localized("/about", { changeFrequency: "monthly", priority: 0.4 }),
    ...localized("/contact", { changeFrequency: "monthly", priority: 0.5 }),
    ...categories.flatMap((c) => localized(`/categorii/${c.slug}`, { changeFrequency: "weekly", priority: 0.7 })),
    ...products.flatMap((p) =>
      localized(`/menu/${p.slug}`, { changeFrequency: "weekly", priority: 0.8, images: [absoluteUrl(p.image)] }),
    ),
  ];
}
