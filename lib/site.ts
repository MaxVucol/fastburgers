/**
 * Public origin for canonical URLs, sitemap and Open Graph. Prefers an explicit
 * NEXT_PUBLIC_SITE_URL (custom domain), then the production domain Vercel exposes.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

// Facts only — user-facing copy lives in lib/i18n/dictionaries.
export const siteConfig = {
  name: "Fast Burgers",
  shortName: "FastBurgers",
  url: resolveSiteUrl(),
  phone: "+40 721 000 321",
  phoneHref: "tel:+40721000321",
  email: "salut@fastburgers.ro",
  address: "Str. Ion Câmpineanu 21, București",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
  /** Main navigation; labels come from the dictionary (`t.nav[key]`). */
  nav: [
    { href: "/", key: "home" },
    { href: "/menu", key: "menu" },
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" },
  ],
} as const;

export type NavKey = (typeof siteConfig.nav)[number]["key"];

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
