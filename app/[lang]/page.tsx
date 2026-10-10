import type { Metadata } from "next";
import { Benefits } from "@/components/home/benefits";
import { CategoryIndex } from "@/components/home/category-index";
import { Hero } from "@/components/home/hero";
import { OrderCta } from "@/components/home/order-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { Reviews } from "@/components/home/reviews";
import { FeatureCard, ProductList } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";
import { getReviews } from "@/services/catalog";
import { getMenu } from "@/services/localized-catalog";

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
  const hits = popular.slice(0, 6);
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
      <Hero spotlight={popular[0] ?? null} />
      <Benefits />

      {hits.length > 0 && (
        <section id="hituri" aria-labelledby="hits-title" className="container-page section-y scroll-mt-[calc(var(--header-h)+1rem)]">
          <SectionHeading
            id="hits-title"
            title={t.hits.title}
            lead={t.hits.lead}
            note={t.hits.note}
            action={{ href: href("/menu?filter=popular"), label: t.hits.viewAll }}
          />
          {/* Phones show three; the rest appear from tablet width up. */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 [&>*:nth-child(n+4)]:hidden md:[&>*:nth-child(n+4)]:grid">
            {hits.map((p, i) => (
              <FeatureCard key={p.id} product={p} eager={i < 2} />
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-line">
        <CategoryIndex categories={categories} counts={counts} />
      </div>

      {promo && <PromoBanner product={promo} />}

      {picks.length > 0 && (
        <section aria-labelledby="picks-title" className="container-page section-y">
          <SectionHeading
            id="picks-title"
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
