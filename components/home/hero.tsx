import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, CookingPot, Leaf } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

const FACT_ICONS = [CookingPot, Leaf, Bike];

/**
 * First screen as a campaign poster on a full-bleed graphite stage: the slogan set huge in four
 * lines (the second half in orange), the burger large on the right melting into the dark, one
 * call to action, and the three promises as a strip along the bottom of the stage.
 * Phones: slogan, photo, button, then the copy, so the button stays in the first viewport.
 * One <Image> serves every layout, so there is a single LCP request, and it has no entrance
 * animation (fading the LCP element in only delays the moment it counts as painted).
 * `burgersFrom`: the lowest burger price on the menu, shown as a link to the category.
 */
export async function Hero({ burgersFrom }: { burgersFrom: number | null }) {
  const { locale, t, href } = await getI18n();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ink text-on-dark">
      <div className="container-page grid lg:min-h-[min(46rem,calc(100svh-var(--header-h)))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-[1fr_auto]">
        {/* ── Slogan ── */}
        <div className="relative z-10 pt-8 sm:pt-12 lg:col-start-1 lg:row-start-1 lg:self-center lg:pt-14 lg:pb-10">
          <p className="enter type-eyebrow text-[0.6875rem] tracking-[0.14em] text-flame sm:text-xs">{t.hero.eyebrow}</p>
          {/* The slogan is part of the brand and stays in English on every locale. */}
          <h1 id="hero-title" lang="en" className="enter type-poster mt-5 [--enter-step:1]">
            {siteConfig.slogan.map((line, i) =>
              line.split(" ").map((word) => (
                <span key={`${i}-${word}`} className={i === 1 ? "block text-accent" : "block"}>
                  {word}{" "}
                </span>
              )),
            )}
          </h1>
          <div className="enter hidden [--enter-step:2] lg:block">
            <p className="mt-8 max-w-[29rem] text-[1.0625rem] leading-relaxed text-muted-on-dark">{t.hero.lead}</p>
            <ButtonLink href={href("/menu")} size="lg" className="mt-8 px-8">
              {t.hero.primary}
              <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        {/* ── Photo: bleeds off the right edge on desktop, full width on phones ── */}
        <div
          className={[
            "relative -mx-[var(--gutter)] -mt-6 h-[clamp(17rem,80vw,30rem)] [container-type:size]",
            "lg:col-start-2 lg:row-start-1 lg:mt-0 lg:ml-0 lg:h-auto",
            "lg:mr-[calc((var(--gutter)+max(0px,(100vw-var(--page-max))/2))*-1)]",
          ].join(" ")}
        >
          {/* Never wider than the photo's own 0.9:1 frame, so the whole burger stays in shot; the oval
              mask melts the studio backdrop into the stage. `sizes`: 0.9 × the photo height. */}
          <div className="absolute inset-y-0 left-1/2 w-[min(100cqw,90cqh)] -translate-x-1/2 [mask-image:radial-gradient(closest-side,#000_74%,transparent)] lg:left-[46%]">
            <Image
              src="/images/hero/hero.webp"
              alt={t.hero.imageAlt}
              fill
              preload
              quality={85}
              sizes="(min-width: 1024px) min(46vw, 42rem), min(72vw, 27rem)"
              className="object-cover object-[47%_50%]"
            />
          </div>
          {burgersFrom !== null && (
            <Link
              href={href("/categorii/burgeri")}
              className="group absolute bottom-[6%] left-[var(--gutter)] inline-flex items-center gap-3 rounded-full bg-on-dark py-1.5 pr-1.5 pl-4 text-sm font-semibold text-ink shadow-[var(--shadow-lift)] transition-colors hover:bg-paper lg:bottom-[10%] lg:left-[6%]"
            >
              {fill(t.hero.from, { price: formatPrice(burgersFrom, locale) })}
              <span className="grid size-8 place-items-center rounded-full bg-accent transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          )}
        </div>

        {/* ── Phones and tablets: the button right under the photo, then the copy ── */}
        <div className="relative z-10 pt-6 lg:hidden">
          <ButtonLink href={href("/menu")} size="lg" className="w-full px-8 min-[420px]:w-auto">
            {t.hero.primary}
            <ArrowRight className="size-4.5" aria-hidden />
          </ButtonLink>
          <p className="mt-6 max-w-[34rem] leading-relaxed text-muted-on-dark">{t.hero.lead}</p>
        </div>

        {/* ── The three promises along the bottom of the stage ── */}
        <ul
          aria-label={t.benefits.title}
          className="relative z-10 mt-8 grid grid-cols-3 border-t border-line-dark py-5 sm:py-6 lg:col-span-2 lg:row-start-2 lg:mt-0"
        >
          {t.benefits.items.map((item, i) => {
            const Icon = FACT_ICONS[i] ?? Leaf;
            return (
              <li key={item.title} className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center sm:gap-3.5 sm:pr-6">
                <Icon className="size-5 shrink-0 text-flame sm:size-6" strokeWidth={1.7} aria-hidden />
                <p className="text-xs leading-snug text-muted-on-dark sm:text-sm">
                  <span className="block text-[0.8125rem] font-semibold text-on-dark sm:text-[0.9375rem]">{item.title}</span>
                  {item.text}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
