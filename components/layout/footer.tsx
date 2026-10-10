import Link from "next/link";
import { cacheLife } from "next/cache";
import { Mail, MapPin, Phone } from "lucide-react";
import { localizeCategory } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { getCategories } from "@/services/catalog";
import { Logo } from "./logo";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}
function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden>
      <path d="M16.6 3c.4 2.1 1.7 3.4 3.9 3.6v3a7 7 0 0 1-3.9-1.2v6.3A5.7 5.7 0 1 1 10.9 9v3.1a2.6 2.6 0 1 0 2.6 2.6V3h3.1Z" />
    </svg>
  );
}

/** Cached so the static shell can include it (Cache Components forbids bare `new Date()`). */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="type-eyebrow mb-5 text-muted-on-dark">{children}</h2>;
}

export async function Footer() {
  const [{ locale, t, href }, categories] = await Promise.all([getI18n(), getCategories()]);
  const nav = [
    ...siteConfig.nav.map((item) => ({ href: item.href, label: t.nav[item.key] })),
    { href: "/account", label: t.nav.track },
    { href: "/checkout", label: t.nav.checkout },
  ];
  // Only profiles that are actually configured get an icon (see siteConfig.social).
  const socials = [
    { href: siteConfig.social.instagram, label: "Instagram", icon: <InstagramIcon /> },
    { href: siteConfig.social.facebook, label: "Facebook", icon: <FacebookIcon /> },
    { href: siteConfig.social.tiktok, label: "TikTok", icon: <TiktokIcon /> },
  ].filter((s) => s.href !== "");

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-on-dark">
      <div className="container-page grid gap-12 pt-16 pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.35fr] lg:gap-10 lg:pt-20">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo href={href("/")} label={t.header.homeLink} tone="dark" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-on-dark">{t.footer.about}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fill(t.footer.social, { name: siteConfig.name, network: s.label })}
                    className="grid size-10 place-items-center rounded-full border border-line-dark text-on-dark transition-colors duration-[var(--duration-fast)] hover:border-accent hover:bg-accent hover:text-ink"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label={t.footer.navigation}>
          <ColumnTitle>{t.footer.navigation}</ColumnTitle>
          <ul className="space-y-3 text-[0.9375rem]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={href(item.href)} className="text-on-dark/85 transition-colors hover:text-flame">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t.footer.categories}>
          <ColumnTitle>{t.footer.categories}</ColumnTitle>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-[0.9375rem] sm:grid-cols-1">
            {categories.map((c) => {
              const category = localizeCategory(c, locale);
              return (
                <li key={c.id}>
                  <Link href={href(`/categorii/${c.slug}`)} className="text-on-dark/85 transition-colors hover:text-flame">
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div>
          <ColumnTitle>{t.footer.contact}</ColumnTitle>
          <ul className="space-y-3 text-[0.9375rem]">
            <li className="flex gap-2.5 text-on-dark/85">
              <MapPin className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
              {siteConfig.address}
            </li>
            <li>
              <a href={siteConfig.phoneHref} className="flex gap-2.5 font-semibold hover:text-flame">
                <Phone className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex gap-2.5 text-on-dark/85 hover:text-flame">
                <Mail className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden />
                {siteConfig.email}
              </a>
            </li>
          </ul>
          <dl className="mt-6 space-y-2 border-t border-line-dark pt-5 text-sm">
            {t.hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-4">
                <dt className="text-muted-on-dark">{h.days}</dt>
                <dd className="font-semibold tabular-nums">{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="container-page">
        <div className="flex flex-col gap-2 border-t border-line-dark py-6 text-xs text-muted-on-dark sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {siteConfig.name}. {t.footer.rights}
          </p>
          <p>{t.footer.vat}</p>
        </div>
      </div>

      {/* Oversized wordmark — the footer's signature; shown whole so the Q keeps its tail. Decorative only. */}
      <p
        aria-hidden
        data-text="BUNIQ"
        className="pointer-events-none pb-[0.06em] text-center font-display text-[24vw] leading-[0.82] font-extrabold tracking-[-0.06em] text-graphite-soft select-none before:content-[attr(data-text)]"
      />
    </footer>
  );
}
