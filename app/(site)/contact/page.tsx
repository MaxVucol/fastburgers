import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { getPickupLocations } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Contact și locații",
  description: "Adresele restaurantelor Fast Burgers din București, telefon, email și programul de funcționare.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const locations = await getPickupLocations();

  return (
    <div className="container-page py-10 sm:py-16">
      <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent uppercase">Contact</p>
      <h1 className="max-w-2xl text-4xl leading-[1.02] font-extrabold sm:text-6xl">Hai pe la noi sau sună-ne.</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="contact-title" className="rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
          <h2 id="contact-title" className="text-xl font-extrabold">Comenzi și întrebări</h2>
          <ul className="mt-5 space-y-4">
            <li>
              <a href={siteConfig.phoneHref} className="flex items-center gap-3 font-display text-2xl font-extrabold hover:text-accent">
                <Phone className="size-5 text-accent" aria-hidden /> {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-3 font-semibold hover:text-accent">
                <Mail className="size-5 text-accent" aria-hidden /> {siteConfig.email}
              </a>
            </li>
          </ul>
          <h3 className="mt-8 flex items-center gap-2 font-bold">
            <Clock className="size-5 text-accent" aria-hidden /> Program livrări
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            {siteConfig.hours.map((h) => (
              <div key={h.days} className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">{h.days}</dt>
                <dd className="font-semibold tabular-nums">{h.time}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="locations-title">
          <h2 id="locations-title" className="sr-only">Restaurante</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {locations.map((l) => (
              <li key={l.id} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                <h3 className="text-lg font-extrabold">{l.name}</h3>
                <p className="mt-3 flex gap-2 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {l.address}
                </p>
                <p className="mt-2 flex gap-2 text-sm text-ink-soft">
                  <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {l.hours}
                </p>
                <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="mt-2 flex gap-2 text-sm font-semibold hover:text-accent">
                  <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {l.phone}
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-bold text-accent hover:underline"
                >
                  Deschide în Google Maps →
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
