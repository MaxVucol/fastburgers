import type { Metadata } from "next";
import { Benefits } from "@/components/home/benefits";
import { CategoryIndex } from "@/components/home/category-index";
import { Hero } from "@/components/home/hero";
import { OrderCta } from "@/components/home/order-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { Reviews } from "@/components/home/reviews";
import { ProductList } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";
import { getReviews } from "@/services/catalog";
import { getLocalizedProduct, getMenu } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: localeAlternates(locale, "/") };
}

export default async function HomePage() {
  const { locale, t, href } = await getI18n();
  const [{ categories, products }, reviews] = await Promise.all([getMenu(locale), getReviews()]);

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
  // The Classic Combo is a Classic Smash, classic fries and a canned drink: the banner shows those
  // menu items. If any of them is missing, it falls back to the single promo photo.
  const bySlug = (slug: string) => products.find((p) => p.slug === slug);
  const [fries, drink, smash] = [bySlug("classic-fries"), bySlug("coca-cola"), await getLocalizedProduct("classic-smash", locale)];
  // The burger's gallery shot shows it whole (bun to bun), which reads better in the composition.
  const burgerImage = smash?.images.find((src) => src !== smash.image) ?? smash?.image;
  const promoParts =
    promo?.slug === "classic-combo" && burgerImage && fries && drink
      ? { burger: burgerImage, fries: fries.image, drink: drink.image }
      : null;

  return (
    <>
      <JsonLd data={restaurantJsonLd(t.meta.description, href("/menu"))} />
      <Hero />
      <Benefits />

      <CategoryIndex categories={categories} counts={counts} />

      {hits.length > 0 && (
        <section id="hituri" aria-labelledby="hits-title" className="container-page pb-[var(--section-y)] scroll-mt-[calc(var(--header-h)+1rem)]">
          <SectionHeading
            id="hits-title"
            eyebrow={t.hits.eyebrow}
            title={t.hits.title}
            lead={t.hits.lead}
            note={t.hits.note}
            action={{ href: href("/menu?filter=popular"), label: t.hits.viewAll }}
          />
          <ProductList products={hits} layout="rows" />
        </section>
      )}

      {promo && <PromoBanner product={promo} parts={promoParts} />}

      {picks.length > 0 && (
        <section aria-labelledby="picks-title" className="container-page pb-[var(--section-y)]">
          <SectionHeading
            id="picks-title"
            eyebrow={t.picks.eyebrow}
            title={t.picks.title}
            lead={t.picks.lead}
            action={{ href: href("/menu"), label: t.categories.viewAll }}
          />
          <ProductList products={picks} layout="rail" />
          <div className="mt-10 flex justify-center">
            <ButtonLink href={href("/menu")} variant="outline" size="lg">
              {plural(locale, products.length, t.picks.viewAll)}
            </ButtonLink>
          </div>
        </section>
      )}

      <Reviews reviews={reviews} />
      <OrderCta />
    </>
  );
}
