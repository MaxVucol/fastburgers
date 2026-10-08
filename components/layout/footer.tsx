import Link from "next/link";
import { cacheLife } from "next/cache";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { getCategories } from "@/services/catalog";
import { Logo } from "./logo";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}
function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
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

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="mt-auto border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:py-16">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Smash burgers, pizza la cuptor și pui crocant, gătite la comandă din ingrediente proaspete.
            Livrăm rapid în București sau te așteptăm în restaurant.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { href: siteConfig.social.instagram, label: "Instagram", icon: <InstagramIcon /> },
              { href: siteConfig.social.facebook, label: "Facebook", icon: <FacebookIcon /> },
              { href: siteConfig.social.tiktok, label: "TikTok", icon: <TiktokIcon /> },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${siteConfig.name} pe ${s.label}`}
                className="grid size-10 place-items-center rounded-xl bg-ivory text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Navigare footer">
          <h2 className="mb-4 text-sm font-bold tracking-wider text-ink uppercase">Navigare</h2>
          <ul className="space-y-2.5 text-sm">
            {[...siteConfig.nav, { href: "/account", label: "Urmărește comanda" }, { href: "/checkout", label: "Coș & checkout" }].map(
              (item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <nav aria-label="Categorii">
          <h2 className="mb-4 text-sm font-bold tracking-wider text-ink uppercase">Categorii</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categorii/${c.slug}`} className="text-muted hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-sm font-bold tracking-wider text-ink uppercase">Contact & program</h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {siteConfig.address}
            </li>
            <li>
              <a href={siteConfig.phoneHref} className="flex gap-2.5 font-semibold text-ink hover:text-accent">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex gap-2.5 hover:text-accent">
                <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {siteConfig.email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                {siteConfig.hours.map((h) => (
                  <div key={h.days} className="contents">
                    <dt>{h.days}</dt>
                    <dd className="font-semibold text-ink tabular-nums">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© <CurrentYear /> {siteConfig.name}. Toate drepturile rezervate.</p>
          <p>Prețurile includ TVA. Fotografiile sunt cu titlu de prezentare.</p>
        </div>
      </div>
    </footer>
  );
}
