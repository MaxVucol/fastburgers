import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getCategories, getMenuProducts } from "@/services/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getMenuProducts()]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/menu"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/categorii/${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/menu/${p.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [absoluteUrl(p.image)],
    })),
  ];
}
