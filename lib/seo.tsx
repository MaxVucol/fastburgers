import { absoluteUrl, siteConfig } from "@/lib/site";
import type { ProductDetail } from "@/types/catalog";

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };

/** Renders structured data; `<` is escaped so the payload can never close the script tag. */
export function JsonLd({ data }: { data: { [key: string]: JsonLdValue } }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function restaurantJsonLd(): { [key: string]: JsonLdValue } {
  return {
    "@context": "https://schema.org",
    "@type": "FastFoodRestaurant",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    image: absoluteUrl("/images/hero/hero.webp"),
    servesCuisine: ["Burgers", "Pizza", "American"],
    priceRange: "$$",
    hasMenu: absoluteUrl("/menu"),
    acceptsReservations: false,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Str. Ion Câmpineanu 21",
      addressLocality: "București",
      addressCountry: "RO",
    },
    openingHours: ["Mo-Th 11:00-23:00", "Fr-Sa 11:00-01:00", "Su 12:00-22:00"],
  };
}

export function productJsonLd(product: ProductDetail): { [key: string]: JsonLdValue } {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => absoluteUrl(src)),
    url: absoluteUrl(`/menu/${product.slug}`),
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "RON",
      availability: "https://schema.org/InStock",
    },
    ...(product.calories
      ? { nutrition: { "@type": "NutritionInformation", calories: `${product.calories} kcal` } }
      : {}),
  };
}
