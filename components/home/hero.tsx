import { Bike, CookingPot, Leaf } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { HeroSlider, type HeroSlide } from "./hero-slider";

const FACT_ICONS = [CookingPot, Leaf, Bike];

/** The banners, in order; each links to the part of the menu it is about. */
const SLIDES = [
  { src: "/images/hero/menu-toamna.webp", to: "/menu" },
  { src: "/images/hero/kids-menu.webp", to: "/menu" },
  { src: "/images/hero/e-mai-gustos-impreuna.webp", to: "/categorii/pizza" },
];

/**
 * First screen: a slideshow of the current offers (autumn menu, kids menu, the five-pizza offer) with arrows and dots,
 * and the three promises in a strip under it. The page heading is the brand slogan, kept for
 * search engines and screen readers (the banners carry their own text). The first banner is the
 * page's LCP image and is preloaded.
 */
export async function Hero() {
  const { t, href } = await getI18n();
  const slides: HeroSlide[] = SLIDES.map(({ src, to }, i) => ({ src, alt: t.hero.slides[i] ?? "", href: href(to) }));

  return (
    // Below `md` the banner touches the header (no gap above it) and both screen edges (see HeroSlider).
    <section aria-labelledby="hero-title" className="container-page pt-0 pb-[var(--section-y)] md:pt-8">
      {/* The slogan is part of the brand and stays in English on every locale. */}
      <h1 id="hero-title" lang="en" className="sr-only">
        {siteConfig.slogan.join(" ")}
      </h1>

      <HeroSlider slides={slides} />

      <ul aria-label={t.benefits.title} className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 sm:mt-8 sm:flex sm:justify-center sm:gap-12 sm:pt-6 lg:gap-20">
        {t.benefits.items.map((item, i) => {
          const Icon = FACT_ICONS[i] ?? Leaf;
          return (
            <li key={item.title} className="flex flex-col items-start gap-2 pr-2 sm:flex-row sm:items-center sm:gap-3">
              <Icon className="size-5 shrink-0 text-accent-ink sm:size-6" strokeWidth={1.7} aria-hidden />
              <p className="text-[0.8125rem] leading-snug text-muted">
                <span className="block text-[0.8125rem] font-semibold text-ink sm:text-sm">{item.title}</span>
                {item.text}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
