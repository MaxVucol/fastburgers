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

export function restaurantJsonLd(description: string, menuPath: string): { [key: string]: JsonLdValue } {
  return {
    "@context": "https://schema.org",
    "@type": "FastFoodRestaurant",
    name: siteConfig.name,
    description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    image: absoluteUrl("/images/hero/hero.webp"),
    servesCuisine: ["Burgers", "Pizza", "American"],
    priceRange: "$$",
    hasMenu: absoluteUrl(menuPath),
    acceptsReservations: false,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Str. Ion Câmpineanu 21",
      addressLocality: "București",
      addressCountry: "RO",
    },
    // Same hours as the dictionaries' `hours` (shown in the footer and on the contact page).
    openingHours: ["Mo-Su 11:00-23:00"],
  };
}

export function productJsonLd(product: ProductDetail, path: string): { [key: string]: JsonLdValue } {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => absoluteUrl(src)),
    url: absoluteUrl(path),
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
