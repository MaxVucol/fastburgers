import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Crown, ScribbleArrow, Swash } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

/**
 * First screen. Phones: copy and CTA, then the burger photo with a slanted top edge.
 * Desktop: copy on cream, the photo in a graphite panel with a diagonal edge that bleeds off
 * the right side of the viewport. The three promises follow as their own band (Benefits).
 * One <Image> serves both layouts, so there is a single LCP request. The photo panel has no
 * entrance animation: fading the LCP element in only delays the moment it counts as painted.
 */
export async function Hero() {
  const { t, href } = await getI18n();
  const [lineOne, lineTwo] = siteConfig.slogan;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page grid lg:min-h-[min(42rem,calc(100svh-var(--header-h)-6rem))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
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
            "relative -mx-[var(--gutter)] h-[clamp(19rem,92vw,32rem)] overflow-hidden bg-ink [container-type:size]",
            "[clip-path:polygon(0_7%,100%_0,100%_100%,0_100%)]",
            "lg:col-start-2 lg:row-start-1 lg:ml-0 lg:h-auto",
            "lg:mr-[calc((var(--gutter)+max(0px,(100vw-var(--page-max))/2))*-1)]",
            "lg:[clip-path:polygon(17%_0,100%_0,100%_100%,0_100%)]",
          ].join(" ")}
        >
          {/* The photo is never wider than its own 0.9:1 frame (90% of the panel height), so the whole
              burger stays in shot on any panel shape; on wider panels the edges fade into the graphite.
              Centred a little right on desktop, where the diagonal hides the panel's left edge.
              `sizes` mirrors that width: 0.9 × panel height (92vw on phones, capped at 32rem; ~46rem on desktop). */}
          <div className="absolute inset-y-0 left-1/2 w-[min(100cqw,90cqh)] -translate-x-1/2 lg:left-[53%]">
            <Image
              src="/images/hero/hero.webp"
              alt={t.hero.imageAlt}
              fill
              preload
              quality={85}
              sizes="(min-width: 1024px) min(52vw, 42rem), min(83vw, 29rem)"
              className="object-cover object-[47%_50%]"
            />
            {/* Fade width follows the spare room beside the photo: a hairline vignette when the photo fills
                the panel, a long blend when graphite shows on both sides (never over the burger itself). */}
            <span className="absolute inset-y-0 left-0 w-[clamp(1.25rem,min(20%,calc((100cqw-90cqh)*0.6)),10rem)] bg-gradient-to-r from-ink to-transparent" aria-hidden />
            <span className="absolute inset-y-0 right-0 w-[clamp(1.25rem,min(20%,calc((100cqw-90cqh)*0.6)),10rem)] bg-gradient-to-l from-ink to-transparent" aria-hidden />
            <span className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-ink/80 to-transparent" aria-hidden />
          </div>
          {/* One brand accent, kept small and on the dark backdrop so it never sits on the food. */}
          <Crown
            className="absolute top-[9%] right-[7%] h-9 rotate-[14deg] text-accent sm:h-11 lg:top-[8%] lg:right-[8%] lg:h-14"
            strokeWidth={3}
          />
          {/* Handwritten note on the dark plate under the burger, its arrow pointing back at the food. */}
          <p
            aria-hidden
            className="type-script absolute right-[5%] bottom-[5%] flex items-end gap-1 text-[1.5rem] text-flame sm:text-[1.9rem] lg:right-[6%] lg:bottom-[6%] lg:text-[2.25rem]"
          >
            <ScribbleArrow className="mb-3 h-6 w-9 -scale-x-100 rotate-[160deg] text-on-dark/75 sm:h-8 sm:w-11" />
            <span className="-rotate-6 leading-[0.95] before:content-[attr(data-text)]" data-text={t.hero.note} />
          </p>
        </div>
      </div>
    </section>
  );
}
