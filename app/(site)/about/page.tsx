import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { WhyUs } from "@/components/home/why-us";

export const metadata: Metadata = {
  title: "Despre noi",
  description:
    "Povestea Fast Burgers: o bucătărie mică din centrul Bucureștiului care face smash burgers, pizza și pui crocant fără scurtături.",
  alternates: { canonical: "/about" },
};

const stats = [
  { value: "2019", label: "anul primului smash burger" },
  { value: "3", label: "restaurante în București" },
  { value: "48h", label: "maturare pentru blatul de pizza" },
  { value: "~30 min", label: "timp mediu de livrare" },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent uppercase">Despre noi</p>
          <h1 className="text-4xl leading-[1.02] font-extrabold sm:text-6xl">Am pornit de la o plită și o obsesie.</h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft sm:text-lg">
            <p>
              Fast Burgers a început în 2019 într-un spațiu de 30 de metri pătrați pe Ion Câmpineanu, cu o singură
              plită și o idee simplă: burgerul perfect are crustă, nu doar gust.
            </p>
            <p>
              Între timp am adăugat pizza cu blat crescut lent, pui marinat peste noapte și cartofi tăiați în fiecare
              dimineață. Regula a rămas aceeași: totul se gătește după ce comanzi.
            </p>
          </div>
          <ButtonLink href="/menu" size="lg" className="mt-8">
            Vezi meniul
          </ButtonLink>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-sand">
            <Image
              src="/images/products/classic-smash/2.webp"
              alt="Burger cu vită, cheddar topit și sosul casei"
              fill
              preload
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
            <Image src="/images/products/margherita/main.webp" alt="Pizza Margherita cu busuioc" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
            <Image src="/images/products/crispy-tenders/main.webp" alt="Fâșii de pui crocant cu sos" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section aria-label="Cifre" className="container-page pb-14">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="order-first font-display text-3xl font-extrabold text-accent sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <WhyUs />
      <div className="h-16" />
    </>
  );
}
