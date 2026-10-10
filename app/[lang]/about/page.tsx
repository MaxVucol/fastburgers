import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Award, ChefHat, Leaf, Soup } from "lucide-react";
import { Crown } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getI18n, localeAlternates } from "@/lib/i18n/server";

const PRINCIPLE_ICONS = [Leaf, ChefHat, Soup, Award];

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.meta.aboutTitle,
    description: t.meta.aboutDescription,
    alternates: localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage() {
  const { t, href } = await getI18n();

  return (
    <>
      <section className="container-page grid items-center gap-12 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-24">
        <div>
          <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
            <Crown className="h-3.5 text-accent-ink" />
            {t.about.eyebrow}
          </p>
          <h1 className="type-h1 mt-4">{t.about.title}</h1>
          <div className="mt-7 max-w-xl space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
            {t.about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <ButtonLink href={href("/menu")} size="lg" className="mt-9">
            {t.common.viewMenu}
            <ArrowRight className="size-4.5" aria-hidden />
          </ButtonLink>
        </div>

        {/* Offset photo trio: one large frame, two smaller ones stepping down. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[var(--radius-panel)] bg-sand">
            <Image
              src="/images/products/classic-smash/2.webp"
              alt={t.about.imageMain}
              fill
              preload
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-sand">
            <Image src="/images/products/margherita/main.webp" alt={t.about.imagePizza} fill sizes="(min-width: 1024px) 310px, 50vw" className="object-cover" />
          </div>
          <div className="relative aspect-square translate-y-6 overflow-hidden rounded-[var(--radius-card)] bg-sand">
            <Image src="/images/products/crispy-tenders/main.webp" alt={t.about.imageChicken} fill sizes="(min-width: 1024px) 310px, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section aria-label={t.about.statsLabel} className="bg-ink text-on-dark">
        <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
          {t.about.stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col gap-2 py-10 lg:py-14 ${i % 2 === 1 ? "border-l border-line-dark pl-6" : "pr-6"} ${i > 1 ? "border-t border-line-dark lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""}`}
            >
              <dt className="order-last text-sm text-muted-on-dark">{s.label}</dt>
              <dd className="font-display text-5xl leading-none font-semibold text-flame sm:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="principles-title" className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          <div>
            <h2 id="principles-title" className="type-h2">{t.about.principlesTitle}</h2>
            <p className="mt-4 text-muted sm:text-lg">{t.about.principlesLead}</p>
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {t.about.principles.map((item, i) => {
              const Icon = PRINCIPLE_ICONS[i] ?? Leaf;
              return (
                <li key={item.title} className="reveal border-t border-line py-6">
                  <Icon className="size-6 text-accent-ink" aria-hidden strokeWidth={1.7} />
                  <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal">{item.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
