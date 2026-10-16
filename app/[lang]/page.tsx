import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIndex } from "@/components/home/category-index";
import { Hero } from "@/components/home/hero";
import { Hits } from "@/components/home/hits";
import { OrderCta } from "@/components/home/order-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { Reviews } from "@/components/home/reviews";
import { ProductCard } from "@/components/product/product-card";
import { ScrollRail } from "@/components/ui/scroll-rail";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";
import { getReviews } from "@/services/catalog";
import { getMenu } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: localeAlternates(locale, "/") };
}

/** How many dishes the "worth trying" row holds. */
const PICKS_COUNT = 12;

export default async function HomePage() {
  const { locale, t, href } = await getI18n();
  // Reviews are fetched only while they may be shown (see siteConfig.showReviews).
  const [{ categories, products }, reviews] = await Promise.all([
    getMenu(locale),
    siteConfig.showReviews ? getReviews() : [],
  ]);

  const counts: Record<string, number> = {};
  for (const p of products) counts[p.categorySlug] = (counts[p.categorySlug] ?? 0) + 1;

  const popular = products.filter((p) => p.popular);
  const hits = popular.slice(0, 4);
  // "Worth trying": new, popular, highlighted and discounted dishes, taken in turns from every category
  // (so the row runs from pizza to desserts), without the ones already shown above as the hits.
  const hitIds = new Set(hits.map((p) => p.id));
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    if (hitIds.has(p.id) || !(p.isNew || p.popular || p.featured || (p.oldPrice && p.oldPrice > p.price))) continue;
    byCategory.set(p.categorySlug, [...(byCategory.get(p.categorySlug) ?? []), p]);
  }
  const picks: typeof products = [];
  for (let round = 0; picks.length < PICKS_COUNT; round++) {
    const before = picks.length;
    for (const list of byCategory.values()) if (list[round] && picks.length < PICKS_COUNT) picks.push(list[round]);
    if (picks.length === before) break;
  }
  const promo =
    products.find((p) => p.slug === "classic-combo") ??
    products.find((p) => p.categorySlug === "combo" && p.oldPrice) ??
    null;

  return (
    <>
      <JsonLd data={restaurantJsonLd(t.meta.description, href("/menu"))} />
      <Hero />

      <CategoryIndex categories={categories} counts={counts} />

      <Hits products={hits} />

      {promo && <PromoBanner product={promo} />}

      {picks.length > 0 && (
        <section aria-labelledby="picks-title" className="container-page section-y">
          <SectionHeading id="picks-title" eyebrow={t.picks.eyebrow} title={t.picks.title} lead={t.picks.lead} />
          {/* One scrolling row instead of a two-row grid of identical cards: shorter, and the
              buttons make the extra items obvious on every screen. */}
          <ScrollRail
            label={t.picks.title}
            prevLabel={t.picks.prev}
            nextLabel={t.picks.next}
          >
            {picks.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} className="w-full" />
              </li>
            ))}
            {/* The last card of the row leads to the whole menu (instead of a button under the row). */}
            <li>
              <Link
                href={href("/menu")}
                className="group flex w-full flex-col justify-between gap-8 rounded-[var(--radius-card)] border border-line bg-cream p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_20px_-10px_rgb(0_0_0/0.22)] transition-[border-color,box-shadow] duration-[450ms] hover:border-ink/30 hover:shadow-[0_2px_4px_rgb(0_0_0/0.08),0_12px_24px_-12px_rgb(0_0_0/0.3)] motion-reduce:transition-none"
              >
                <span className="font-display text-[1.375rem] leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-[1.5rem]">
                  {plural(locale, products.length, t.picks.viewAll)}
                </span>
                <span className="grid size-12 place-items-center rounded-full border-[1.5px] border-accent text-accent-ink transition-colors duration-[var(--duration-fast)] group-hover:bg-accent group-hover:text-on-accent">
                  <ArrowRight className="size-5" aria-hidden />
                </span>
              </Link>
            </li>
          </ScrollRail>
        </section>
      )}

      {siteConfig.showReviews && <Reviews reviews={reviews} />}
      <OrderCta />
    </>
  );
}
