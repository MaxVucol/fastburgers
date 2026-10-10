import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Crown, ScribbleArrow, Swash } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { Benefits } from "./benefits";

/**
 * First screen. Phones: copy and CTA, then the burger photo with a slanted top edge, then
 * the three promises. Desktop: copy and promises on cream, the photo in a graphite panel
 * with a diagonal edge that bleeds off the right side of the viewport.
 * One <Image> serves both layouts, so there is a single LCP request. The photo panel has no
 * entrance animation: fading the LCP element in only delays the moment it counts as painted.
 */
export async function Hero() {
  const { t, href } = await getI18n();
  const [lineOne, lineTwo] = siteConfig.slogan;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page grid lg:min-h-[min(46rem,calc(100svh-var(--header-h)))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-[1fr_auto]">
        {/* ── Copy ───────────────────────────────────────── */}
        <div className="relative z-10 pt-9 pb-9 sm:pt-12 lg:col-start-1 lg:row-start-1 lg:self-center lg:py-14 lg:pr-6">
          <p className="enter type-eyebrow text-[0.6875rem] tracking-[0.12em] text-accent-ink sm:text-xs sm:tracking-[0.14em]">
            {t.hero.eyebrow}
          </p>

          {/* The slogan is part of the brand and stays in English on every locale. */}
          <h1 id="hero-title" lang="en" className="enter type-hero mt-4 text-ink [--enter-step:1]">
            <span className="block">{lineOne}</span>
            <span className="relative inline-block">
              {lineTwo}
              <Swash stretch className="absolute -bottom-[0.14em] left-[0.02em] h-[0.16em] w-[96%] text-accent" />
            </span>
          </h1>

          <p className="enter mt-7 max-w-[31rem] text-[1.0625rem] leading-relaxed text-ink-soft [--enter-step:2] sm:text-lg">
            {t.hero.lead}
          </p>

          <div className="enter mt-8 [--enter-step:3]">
            <ButtonLink href={href("/menu")} size="lg" className="w-full px-8 min-[420px]:w-auto">
              {t.hero.primary}
              <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        {/* ── Photo panel (the photo carries the alt text; crown and note are decorative) ── */}
        <div
          className={[
            "relative -mx-[var(--gutter)] h-[clamp(19rem,92vw,32rem)] overflow-hidden bg-ink",
            "[clip-path:polygon(0_7%,100%_0,100%_100%,0_100%)]",
            "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:ml-0 lg:h-auto",
            "lg:mr-[calc((var(--gutter)+max(0px,(100vw-var(--page-max))/2))*-1)]",
            "lg:[clip-path:polygon(17%_0,100%_0,100%_100%,0_100%)]",
          ].join(" ")}
        >
          <Image
            src="/images/hero/hero.webp"
            alt={t.hero.imageAlt}
            fill
            preload
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover object-[50%_40%] lg:object-[58%_28%]"
          />
          <Crown
            className="absolute top-[13%] right-[9%] h-12 rotate-[14deg] text-accent sm:h-16 lg:top-[11%] lg:right-[12%] lg:h-20"
            strokeWidth={3}
          />
          <p
            aria-hidden
            className="type-script absolute right-[6%] bottom-[7%] flex items-end gap-1 text-[1.65rem] text-flame sm:text-[2rem] lg:right-[6%] lg:bottom-[5%] lg:text-[2.4rem]"
          >
            <ScribbleArrow className="mb-3 h-7 w-10 -scale-x-100 rotate-[160deg] text-on-dark/80 sm:h-9 sm:w-12" />
            <span className="-rotate-6 leading-[0.95] before:content-[attr(data-text)]" data-text={t.hero.note} />
          </p>
        </div>

        {/* ── Promises ───────────────────────────────────── */}
        <div className="enter py-7 [--enter-step:4] lg:col-start-1 lg:row-start-2 lg:pt-0 lg:pb-12">
          <Benefits />
        </div>
      </div>
    </section>
  );
}
