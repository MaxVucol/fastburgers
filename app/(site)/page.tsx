import type { Metadata } from "next";
import { CategoryRail } from "@/components/home/category-rail";
import { Hero } from "@/components/home/hero";
import { OrderCta } from "@/components/home/order-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { Reviews } from "@/components/home/reviews";
import { WhyUs } from "@/components/home/why-us";
import { ProductGrid } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategories, getMenuProducts, getReviews } from "@/services/catalog";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [categories, products, reviews] = await Promise.all([
    getCategories(),
    getMenuProducts(),
    getReviews(),
  ]);

  const counts: Record<string, number> = {};
  for (const p of products) counts[p.categorySlug] = (counts[p.categorySlug] ?? 0) + 1;

  const popular = products.filter((p) => p.popular).slice(0, 8);
  const featured = products.filter((p) => p.featured && !p.popular).slice(0, 4);
  const fresh = products.filter((p) => p.isNew && !p.popular && !p.featured).slice(0, 4);
  const promo =
    products.find((p) => p.slug === "classic-combo") ??
    products.find((p) => p.categorySlug === "combo" && p.oldPrice) ??
    null;

  return (
    <>
      <JsonLd data={restaurantJsonLd()} />
      <Hero spotlight={popular[0] ?? null} />
      <CategoryRail categories={categories} counts={counts} />

      <section id="populare" aria-labelledby="popular-title" className="container-page scroll-mt-24 py-6 sm:py-8">
        <SectionHeading
          id="popular-title"
          eyebrow="Cele mai comandate"
          title="Preferatele clienților"
          description="Produsele care pleacă cel mai des din bucătăria noastră. Un tap și sunt în coș."
          action={{ href: "/menu?filter=popular", label: "Toate produsele populare" }}
        />
        <ProductGrid products={popular} layout="rail" eagerCount={2} />
      </section>

      {promo && <PromoBanner product={promo} />}

      {(featured.length > 0 || fresh.length > 0) && (
        <section aria-labelledby="highlights-title" className="container-page py-6 sm:py-8">
          <SectionHeading
            id="highlights-title"
            eyebrow="Din meniu"
            title="Merită încercate"
            description="Best seller-uri și noutăți din fiecare categorie — de la pizza la deserturi."
            action={{ href: "/menu", label: "Vezi tot meniul" }}
          />
          <ProductGrid products={[...featured, ...fresh]} layout="rail" />
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/menu" variant="dark" size="lg">
              Vezi toate cele {products.length} de produse
            </ButtonLink>
          </div>
        </section>
      )}

      <div className="mt-10 sm:mt-14">
        <WhyUs />
      </div>
      <Reviews reviews={reviews} />
      <OrderCta />
    </>
  );
}
