import Image from "next/image";
import { ArrowRight, Bike, CookingPot, Leaf } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

const FACT_ICONS = [CookingPot, Leaf, Bike];

/**
 * First screen as a dark editorial poster: the slogan set huge and uppercase on the left (the
 * second half in orange), the burger photo as a lit panel on the right that bleeds off the
 * viewport edge, the order button and the "burgers from" price (lowest burger price on the
 * menu), and the three promises along the bottom of the stage.
 * The photo is shown as a photograph — cropped, not dissolved — with only a soft fade on the
 * side that meets the copy, so it never melts into the background and no text sits on the food.
 * One <Image> serves every layout, so there is a single LCP request, and it has no entrance
 * animation (fading the LCP element in only delays the moment it counts as painted).
 */
export async function Hero({ burgersFrom }: { burgersFrom: number | null }) {
  const { locale, t, href } = await getI18n();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-night text-on-dark">
      <div className="container-page grid lg:min-h-[min(44rem,calc(100svh-var(--header-h)))] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-[1fr_auto]">
        {/* ── Slogan and actions ── */}
        <div className="relative z-10 pt-5 sm:pt-10 lg:col-start-1 lg:row-start-1 lg:self-center lg:py-14 lg:pr-8">
          <p className="enter type-eyebrow text-[0.6875rem] tracking-[0.14em] text-flame sm:text-xs">{t.hero.eyebrow}</p>
          {/* The slogan is part of the brand and stays in English on every locale. */}
          <h1 id="hero-title" lang="en" className="enter type-poster mt-3 uppercase [--enter-step:1] sm:mt-5">
            {siteConfig.slogan.map((line, i) =>
              line.split(" ").map((word) => (
                <span
                  key={`${i}-${word}`}
                  // "BETTER" is set slightly open: its six wide capitals looked crowded at the poster's tight tracking.
                  className={i === 1 ? (word === "Better" ? "block tracking-[0.01em] text-accent" : "block text-accent") : "block"}
                >
                  {word}{" "}
                </span>
              )),
            )}
          </h1>
          <p className="enter mt-6 hidden max-w-[30rem] text-[1.0625rem] leading-relaxed text-muted-on-dark [--enter-step:2] lg:block">
            {t.hero.lead}
          </p>
          {actions("enter mt-8 hidden [--enter-step:3] lg:flex")}
        </div>

        {/* ── Photo panel: full width on phones, bleeding off the right edge on desktop ── */}
        <div
          className={[
            "relative -mx-[var(--gutter)] mt-2 aspect-[4/3] max-h-[30rem] overflow-hidden sm:mt-6 sm:aspect-[16/10]",
            "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:mr-[calc((var(--gutter)+max(0px,(100vw-var(--page-max))/2))*-1)] lg:ml-0 lg:aspect-auto lg:max-h-none",
          ].join(" ")}
        >
          <Image
            src="/images/hero/cheeseburger.webp"
            alt={t.hero.imageAlt}
            fill
            preload
            quality={85}
            // The 2:1 photo covers a near-square panel, so it renders about twice the panel height wide:
            // ~1400px on desktop, 1.5× / 1.25× the viewport width under the 4:3 / 16:10 phone and tablet panels.
            sizes="(min-width: 1024px) 1400px, (min-width: 640px) 125vw, 150vw"
            className="object-cover object-[80%_50%] lg:object-[70%_50%] xl:object-[74%_50%]"
          />
          {/* Warm key light from the top right and a short fade where the photo meets the copy and the
              strip below — the photo keeps its own contrast everywhere else. */}
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_18%,rgb(255_122_69/0.18),transparent_55%)] mix-blend-screen" aria-hidden />
          <span className="absolute inset-y-0 left-0 hidden w-[22%] bg-gradient-to-r from-night to-transparent lg:block" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-night to-transparent lg:hidden" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-night to-transparent" aria-hidden />
        </div>

        {/* ── Phones and tablets: actions and copy under the photo ── */}
        <div className="relative z-10 -mt-6 lg:hidden">
          {actions("flex")}
          <p className="mt-5 max-w-[34rem] leading-relaxed text-muted-on-dark">{t.hero.lead}</p>
        </div>

        {/* ── The three promises along the bottom of the stage ── */}
        <ul
          aria-label={t.benefits.title}
          className="relative z-10 mt-6 grid grid-cols-3 border-t border-line-dark py-5 sm:mt-8 sm:py-6 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:pr-8"
        >
          {t.benefits.items.map((item, i) => {
            const Icon = FACT_ICONS[i] ?? Leaf;
            return (
              <li key={item.title} className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center sm:gap-3">
                <Icon className="size-5 shrink-0 text-flame sm:size-6" strokeWidth={1.7} aria-hidden />
                <p className="text-[0.8125rem] leading-snug text-muted-on-dark">
                  <span className="block text-[0.8125rem] font-semibold text-on-dark sm:text-sm">{item.title}</span>
                  {item.text}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );

  /** The order button and the "burgers from" link; rendered once per layout (desktop / phones). */
  function actions(className: string) {
    return (
      <div className={`${className} flex-wrap items-center gap-3`}>
        <ButtonLink href={href("/menu")} size="lg" className="w-full px-8 sm:w-auto">
          {t.hero.primary}
          <ArrowRight className="size-4.5" aria-hidden />
        </ButtonLink>
        {burgersFrom !== null && (
          <ButtonLink href={href("/categorii/burgeri")} size="lg" variant="outline-light" className="w-full px-6 sm:w-auto">
            {fill(t.hero.from, { price: formatPrice(burgersFrom, locale) })}
          </ButtonLink>
        )}
      </div>
    );
  }
}
