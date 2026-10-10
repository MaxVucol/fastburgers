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
  name: "BUNIQ",
  shortName: "BUNIQ",
  /** Brand line under the wordmark and the slogan; both stay in English on every locale. */
  tagline: "Burgers & More",
  slogan: ["Real Burgers.", "Better Days."],
  /** Branded social card (1200×630), built by scripts/make-og.mjs. */
  ogImage: "/images/og/buniq.jpg",
  url: resolveSiteUrl(),
  phone: "+40 721 000 321",
  phoneHref: "tel:+40721000321",
  email: "salut@fastburgers.ro",
  address: "Str. Ion Câmpineanu 21, București",
  /**
   * Social profiles. Empty until the real BUNIQ accounts exist — the footer shows an
   * icon only for a filled-in URL, so there are never links to a network's home page.
   */
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
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
