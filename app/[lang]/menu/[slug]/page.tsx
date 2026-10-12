import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductList } from "@/components/product/product-card";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductConfigurator } from "@/components/product/product-configurator";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBadges } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { discountPercent, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { JsonLd, productJsonLd } from "@/lib/seo";
import { getMenuProducts } from "@/services/catalog";
import { getLocalizedProduct, getLocalizedRelated } from "@/services/localized-catalog";

export async function generateStaticParams() {
  const products = await getMenuProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/menu/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale, t }] = await Promise.all([params, getI18n()]);
  const product = await getLocalizedProduct(slug, locale);
  if (!product) return { title: t.meta.productUnavailable, robots: { index: false } };

  const title = `${product.name} — ${formatPrice(product.price, locale)}`;
  return {
    title,
    description: product.shortDescription,
    alternates: localeAlternates(locale, `/menu/${product.slug}`),
    openGraph: {
      type: "website",
      title: `${product.name} | ${siteConfig.name}`,
      description: product.description,
      images: [{ url: product.image, width: 1600, height: 1200, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description: product.shortDescription, images: [product.image] },
  };
}

export default function ProductPage({ params }: PageProps<"/[lang]/menu/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/[lang]/menu/[slug]">["params"] }) {
  const [{ slug }, { locale, t, href }] = await Promise.all([params, getI18n()]);
  const product = await getLocalizedProduct(slug, locale);
  if (!product) notFound();

  const related = await getLocalizedRelated(product, locale);
  const discount = discountPercent(product.price, product.oldPrice);
  const facts = [
    product.weight ? { label: t.product.weight, value: `${product.weight} ${product.weightUnit}` } : null,
    product.calories ? { label: t.product.energy, value: `${product.calories} kcal` } : null,
    { label: t.product.delivery, value: fill(t.product.freeOver, { amount: formatPrice(FREE_DELIVERY_THRESHOLD, locale) }) },
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <>
      <JsonLd data={productJsonLd(product, href(`/menu/${product.slug}`))} />
      <div className="container-page pt-6 pb-16 sm:pt-10">
        <Breadcrumbs
          items={[
            { href: href("/"), label: t.common.home },
            { href: href("/menu"), label: t.common.menu },
            { href: href(`/categorii/${product.categorySlug}`), label: product.categoryName },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <ProductGallery images={product.images.length ? product.images : [product.image]} name={product.name} />
          </div>

          <div>
            <ProductBadges
              popular={product.popular}
              isNew={product.isNew}
              featured={product.featured}
              spicy={product.spicy}
              soldOut={product.soldOut}
              discount={discount}
              labels={{ isNew: t.product.badgeNew, popular: t.product.badgePopular, best: t.product.badgeBest, spicy: t.product.badgeSpicy, soldOut: t.product.soldOut }}
              className="mb-4"
            />
            <p className="type-eyebrow text-muted">{product.categoryName}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="type-h1">{product.name}</h1>
              <FavoriteButton productId={product.id} className="mt-1" />
            </div>
            <Price
              price={product.price}
              oldPrice={product.oldPrice}
              locale={locale}
              oldPriceLabel={t.product.oldPrice}
              size="lg"
              className="mt-5"
            />
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-soft">{product.description}</p>

            <dl
              className="mt-7 grid divide-x divide-line border-y border-line"
              style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}
            >
              {facts.map((f) => (
                <div key={f.label} className="px-3 py-3.5 first:pl-0 sm:px-4">
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold sm:text-[0.9375rem]">{f.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <ProductConfigurator
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  options: product.options,
                  soldOut: product.soldOut,
                }}
              />
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <section aria-labelledby="ingrediente">
                <h2 id="ingrediente" className="type-eyebrow border-b border-line pb-3 text-ink">
                  {t.product.ingredients}
                </h2>
                <ul className="mt-3 space-y-2 text-[0.9375rem] text-ink-soft">
                  {product.ingredients.map((i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="alergeni">
                <h2 id="alergeni" className="type-eyebrow border-b border-line pb-3 text-ink">
                  {t.product.allergens}
                </h2>
                {product.allergens.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {product.allergens.map((a) => (
                      <li key={a} className="rounded-[var(--radius-xs)] bg-sand px-2.5 py-1 text-xs font-semibold text-ink">
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">{t.product.noAllergens}</p>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted">{t.product.allergyNote}</p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line">
          <div className="container-page section-y">
            <SectionHeading id="related-title" title={t.product.relatedTitle} lead={t.product.relatedEyebrow} />
            <ProductList products={related} />
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page pt-6 pb-16 sm:pt-10" aria-busy="true">
      <div className="mb-6 h-4 w-64 animate-pulse rounded bg-sand" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-panel)] bg-sand" />
        <div className="space-y-4">
          <div className="h-16 w-3/4 animate-pulse rounded-[var(--radius-sm)] bg-sand" />
          <div className="h-10 w-36 animate-pulse rounded-[var(--radius-sm)] bg-sand" />
          <div className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-sand" />
          <div className="h-44 animate-pulse rounded-[var(--radius-card)] bg-sand" />
        </div>
      </div>
    </div>
  );
}
