import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { Spark, Strokes, Swash } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types/catalog";

export async function Hero({ spotlight }: { spotlight: ProductCardData | null }) {
  const { locale, t, href } = await getI18n();
  const [lineOne, lineTwo] = t.hero.titleLines;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page grid items-center gap-y-10 pt-8 pb-14 sm:pt-12 lg:min-h-[min(46rem,calc(100svh-var(--header-h)-var(--topbar-h)))] lg:grid-cols-[1.04fr_1fr] lg:gap-x-6 lg:py-12 xl:gap-x-12">
        {/* ── Copy ───────────────────────────────────────── */}
        <div className="relative z-10">
          <p className="enter type-eyebrow flex items-center gap-2 tracking-[0.1em] text-ink-soft sm:tracking-[0.16em]">
            <Spark className="size-3.5 text-accent" />
            {t.hero.eyebrow}
          </p>

          <h1 id="hero-title" className="enter type-hero mt-5 text-ink [--enter-step:1]">
            <span className="block">{lineOne}</span>
            <span className="block">{lineTwo}</span>
          </h1>
          <p
            aria-hidden
            className="enter type-script mt-1 ml-[18%] inline-block -rotate-[5deg] text-[3.25rem] text-accent [--enter-step:2] before:content-[attr(data-text)] sm:text-[4rem] lg:text-[4.5rem]"
            data-text={t.hero.script}
          />

          <p className="enter mt-4 max-w-[30rem] text-[1.0625rem] leading-relaxed text-ink-soft [--enter-step:3] sm:text-lg">
            {t.hero.lead}
          </p>

          <div className="enter mt-8 flex flex-wrap items-center gap-3 [--enter-step:4]">
            {/* Fastest path to an order: the house favourites right below, each with one-tap add. */}
            <ButtonLink href="#hituri" size="lg" className="flex-1 sm:flex-none">
              {t.hero.primary}
              <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
            <ButtonLink href={href("/menu")} size="lg" variant="outline" className="flex-1 sm:flex-none">
              {t.hero.secondary}
            </ButtonLink>
            <p className="flex items-center gap-3 pl-1 sm:ml-2">
              <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-line">
                <Clock className="size-5 text-accent-ink" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-xs text-muted">{t.hero.delivery}</span>
                <span className="block font-display text-lg font-semibold">{t.hero.deliveryValue}</span>
              </span>
            </p>
          </div>
        </div>

        {/* ── Visual: photo "sticker" over a flame disc ─────────── */}
        <div className="relative mx-auto aspect-square w-full max-w-[25rem] sm:max-w-[34rem] lg:max-w-[40rem]">
          <div className="enter absolute top-0 right-0 aspect-square w-[86%] rounded-full bg-accent [--enter-step:1]" aria-hidden />
          <div className="enter absolute bottom-[2%] left-0 aspect-square w-[84%] overflow-hidden rounded-full border-[10px] border-cream bg-ink [--enter-step:2] sm:border-[14px]">
            <Image
              src="/images/hero/hero.webp"
              alt={t.hero.imageAlt}
              fill
              preload
              sizes="(min-width: 1024px) 560px, (min-width: 640px) 460px, 86vw"
              className="object-cover object-[80%_55%]"
            />
          </div>

          <Strokes className="absolute top-[18%] -left-[3%] size-14 -rotate-12 text-accent sm:size-20" />
          <p
            aria-hidden
            className="type-script absolute top-[3%] -left-[2%] -rotate-[8deg] text-[1.75rem] text-ink sm:top-[6%] sm:left-[2%] sm:text-[2.25rem]"
          >
            {t.hero.note}
            <Swash className="h-2.5 w-24 text-accent" />
          </p>

          {spotlight && (
            <Link
              href={href(`/menu/${spotlight.slug}`)}
              className="group absolute right-0 bottom-[5%] flex max-w-[17.5rem] items-center gap-3 rounded-[var(--radius-card)] bg-ink py-3 pr-4 pl-3 text-on-dark shadow-[var(--shadow-lift)] transition-transform duration-[var(--duration-base)] hover:-translate-y-0.5 sm:right-[2%] sm:bottom-[8%]"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-graphite">
                <Image src={spotlight.image} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="type-eyebrow block text-[0.625rem] text-flame">{t.hero.spotlight}</span>
                <span className="block truncate font-display text-lg leading-tight font-semibold">{spotlight.name}</span>
                <span className="text-sm text-muted-on-dark tabular-nums">{formatPrice(spotlight.price, locale)}</span>
              </span>
              <ArrowUpRight
                className="size-5 shrink-0 text-flame transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
