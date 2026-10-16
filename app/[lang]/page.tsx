import type { Metadata } from "next";
import { CategoryIndex } from "@/components/home/category-index";
import { Hero } from "@/components/home/hero";
import { Hits } from "@/components/home/hits";
import { OrderCta } from "@/components/home/order-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { Reviews } from "@/components/home/reviews";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
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
  const featured = products.filter((p) => p.featured && !p.popular).slice(0, 4);
  const fresh = products.filter((p) => p.isNew && !p.popular && !p.featured).slice(0, 4);
  const picks = [...featured, ...fresh].slice(0, 8);
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
            footer={
              <ButtonLink href={href("/menu")} variant="outline" size="lg" className="w-full px-6 sm:w-auto">
                {plural(locale, products.length, t.picks.viewAll)}
              </ButtonLink>
            }
          >
            {picks.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} className="w-full" />
              </li>
            ))}
          </ScrollRail>
        </section>
      )}

      {siteConfig.showReviews && <Reviews reviews={reviews} />}
      <OrderCta />
    </>
  );
}
