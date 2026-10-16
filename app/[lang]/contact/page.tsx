import type { Metadata } from "next";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Crown } from "@/components/ui/brand";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { getLocalizedLocations } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.meta.contactTitle,
    description: t.meta.contactDescription,
    alternates: localeAlternates(locale, "/contact"),
  };
}

export default async function ContactPage() {
  const { locale, t } = await getI18n();
  const locations = await getLocalizedLocations(locale);

  return (
    <div className="container-page pt-10 pb-20 sm:pt-14 sm:pb-28">
      <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
        <Crown className="h-3.5 text-accent-ink" />
        {t.contact.eyebrow}
      </p>
      <h1 className="type-h1 mt-4 max-w-3xl">{t.contact.title}</h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-14">
        <section aria-labelledby="contact-title" className="rounded-[var(--radius-panel)] bg-graphite p-6 text-on-dark sm:p-8">
          <h2 id="contact-title" className="type-eyebrow text-muted-on-dark">{t.contact.ordersTitle}</h2>
          <a
            href={siteConfig.phoneHref}
            className="mt-4 flex items-center gap-3 font-display text-3xl font-semibold text-on-dark hover:text-flame sm:text-4xl"
          >
            <Phone className="size-6 shrink-0 text-flame" aria-hidden /> {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`} className="mt-3 flex items-center gap-3 py-1.5 font-semibold hover:text-flame">
            <Mail className="size-5 text-flame" aria-hidden /> {siteConfig.email}
          </a>
          <h3 className="mt-10 flex items-center gap-2 font-sans text-sm font-semibold tracking-normal">
            <Clock className="size-4.5 text-flame" aria-hidden /> {t.contact.hoursTitle}
          </h3>
          <dl className="mt-3 divide-y divide-line-dark border-y border-line-dark text-sm">
            {t.hours.map((h) => (
              <div key={h.days} className="flex justify-between py-2.5">
                <dt className="text-muted-on-dark">{h.days}</dt>
                <dd className="font-semibold tabular-nums">{h.time}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="locations-title">
          <h2 id="locations-title" className="type-eyebrow border-b-2 border-ink pb-3 text-ink">{t.contact.restaurants}</h2>
          <ul className="divide-y divide-line">
            {locations.map((l) => (
              <li key={l.id} className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em]">{l.name}</h3>
                  <p className="mt-2 flex gap-2 text-sm text-ink-soft">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden /> {l.address}
                  </p>
                  <p className="mt-1.5 flex gap-2 text-sm text-ink-soft">
                    <Clock className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden /> {l.hours}
                  </p>
                  <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="mt-0.5 flex gap-2 py-1.5 text-sm font-semibold hover:text-accent-ink">
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden /> {l.phone}
                  </a>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 self-start rounded-full border-[1.5px] border-ink/85 px-4 py-2 text-sm font-semibold transition-colors hover:bg-ink hover:text-on-iark"
                >
                  {t.contact.maps}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
