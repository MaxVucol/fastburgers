/**
 * Public origin for canonical URLs, sitemap and Open Graph. Prefers an explicit
 * NEXT_PUBLIC_SITE_URL (custom domain), then the production domain Vercel exposes.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Fast Burgers",
  shortName: "FastBurgers",
  tagline: "Smash burgers, pizza & crispy chicken",
  description:
    "Fast Burgers — smash burgers din vită Angus, pizza la cuptor, crispy chicken și cartofi tăiați zilnic. Comandă online cu livrare rapidă în București sau ridicare din restaurant.",
  url: resolveSiteUrl(),
  locale: "ro_RO",
  phone: "+40 721 000 321",
  phoneHref: "tel:+40721000321",
  email: "salut@fastburgers.ro",
  address: "Str. Ion Câmpineanu 21, București",
  hours: [
    { days: "Luni – Joi", time: "11:00 – 23:00" },
    { days: "Vineri – Sâmbătă", time: "11:00 – 01:00" },
    { days: "Duminică", time: "12:00 – 22:00" },
  ],
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
  nav: [
    { href: "/", label: "Acasă" },
    { href: "/menu", label: "Meniu" },
    { href: "/about", label: "Despre noi" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
