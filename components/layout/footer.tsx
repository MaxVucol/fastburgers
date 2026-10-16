import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Crown } from "@/components/ui/brand";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localizeCategory } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { getCategories } from "@/services/catalog";
import { Logo } from "./logo";
import { NewsSlot } from "./news-slot";
import { configuredSocials } from "./social-links";

/** Cached so the static shell can include it (Cache Components forbids bare `new Date()`). */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="type-eyebrow mb-5 text-muted-on-dark">{children}</h2>;
}

type NewsProps = { t: Dictionary; href: (path: string) => string };

/** "What's new": one line with the menu's two real filters (new dishes, live offers). */
function NewsLine({ t, href }: NewsProps) {
  return (
    <section aria-labelledby="footer-news-title" className="border-b border-line-dark">
      <div className="container-page flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between md:gap-8">
        <h2 id="footer-news-title" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-[-0.02em] text-on-dark sm:text-xl">
          <Crown className="h-5 shrink-0 -rotate-6 text-accent" strokeWidth={3} />
          {t.footer.news.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <NewsPill href={href("/menu?filter=new")} label={t.footer.news.cta} />
          <SaleLink href={href("/menu?filter=sale")} label={t.footer.news.sale} />
        </div>
      </div>
    </section>
  );
}

function NewsPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex h-12 items-center justify-between gap-6 rounded-full bg-on-dark pr-1.5 pl-5 text-[0.9375rem] font-semibold text-graphite transition-colors hover:bg-on-dark/85"
    >
      {label}
      <span className="grid size-9 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5">
        <ArrowRight className="size-5" aria-hidden />
      </span>
    </Link>
  );
}

function SaleLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-flame underline-offset-4 hover:underline"
    >
      {label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export async function Footer() {
  const [{ locale, t, href }, categories] = await Promise.all([getI18n(), getCategories()]);
  const nav = [
    ...siteConfig.nav.map((item) => ({ href: item.href, label: t.nav[item.key] })),
    { href: "/account", label: t.nav.track },
    { href: "/checkout", label: t.nav.checkout },
  ];
  const socials = configuredSocials();

  return (
    <footer className="relative mt-auto overflow-hidden bg-graphite text-on-dark">
      {/* What's new — there is no newsletter backend, so instead of a sign-up form that would
          go nowhere this links to the menu's real "new" and "on offer" filters. Hidden in the
          menu and the order flow (see NewsSlot). */}
      <NewsSlot>
        <NewsLine t={t} href={href} />
      </NewsSlot>

      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 pt-14 pb-12 sm:gap-y-12 lg:grid-cols-[1.5fr_1fr_1fr_1.35fr] lg:gap-10 lg:pt-20">
        <div className="col-span-2 lg:col-span-1">
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
                    className="grid size-10 place-items-center rounded-full border border-line-dark text-on-dark transition-colors duration-[var(--duration-fast)] hover:border-accent hover:bg-accent hover:text-on-accent"
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
          <ul className="space-y-3 text-[0.9375rem]">
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

        {/* Phones: navigation and categories side by side, contact across. */}
        <div className="col-span-2 sm:col-span-1">
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
          <p className="sm:text-right">
            {t.footer.vat}
            {/* BUNIQ is a design concept; the contact details, hours and orders are examples. */}
            <span className="mt-1 block text-on-dark/70">{t.footer.demo}</span>
          </p>
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
