import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Flame, Scale, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductCard } from "@/components/product/product-card";
import { ProductConfigurator } from "@/components/product/product-configurator";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBadges } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { JsonLd, productJsonLd } from "@/lib/seo";
import { getMenuProducts, getProductBySlug, getRelatedProducts } from "@/services/catalog";

export async function generateStaticParams() {
  const products = await getMenuProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produs indisponibil", robots: { index: false } };

  const title = `${product.name} — ${formatPrice(product.price)}`;
  return {
    title,
    description: product.shortDescription,
    alternates: { canonical: `/menu/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Fast Burgers`,
      description: product.description,
      url: `/menu/${product.slug}`,
      images: [{ url: product.image, width: 1600, height: 1200, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description: product.shortDescription, images: [product.image] },
  };
}

export default function ProductPage({ params }: PageProps<"/menu/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/menu/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <div className="container-page py-6 sm:py-10">
        <Breadcrumbs
          items={[
            { href: "/", label: "Acasă" },
            { href: "/menu", label: "Meniu" },
            { href: `/categorii/${product.categorySlug}`, label: product.categoryName },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images.length ? product.images : [product.image]} name={product.name} />
          </div>

          <div>
            <ProductBadges
              popular={product.popular}
              isNew={product.isNew}
              featured={product.featured}
              discount={discount}
              className="mb-3"
            />
            <h1 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">{product.name}</h1>
            <Price price={product.price} oldPrice={product.oldPrice} size="lg" className="mt-4" />
            <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">{product.description}</p>

            <dl className="mt-5 flex flex-wrap gap-2 text-sm">
              {product.weight && (
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-line">
                  <Scale className="size-4 text-muted" aria-hidden />
                  <dt className="sr-only">Gramaj</dt>
                  <dd className="font-semibold">{product.weight} {product.weightUnit}</dd>
                </div>
              )}
              {product.calories && (
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-line">
                  <Flame className="size-4 text-muted" aria-hidden />
                  <dt className="sr-only">Valoare energetică</dt>
                  <dd className="font-semibold">{product.calories} kcal</dd>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-line">
                <Truck className="size-4 text-muted" aria-hidden />
                <dt className="sr-only">Livrare</dt>
                <dd className="font-semibold">Gratuit peste {formatPrice(FREE_DELIVERY_THRESHOLD)}</dd>
              </div>
            </dl>

            <div className="mt-7">
              <ProductConfigurator
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  options: product.options,
                }}
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <section aria-labelledby="ingrediente" className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <h2 id="ingrediente" className="text-sm font-bold tracking-wider uppercase">Ingrediente</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                  {product.ingredients.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="alergeni" className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <h2 id="alergeni" className="text-sm font-bold tracking-wider uppercase">Alergeni</h2>
                {product.allergens.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {product.allergens.map((a) => (
                      <li key={a} className="rounded-full bg-mustard-soft px-2.5 py-1 text-xs font-semibold text-[#7a4f00]">
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">Nu conține alergeni majori declarați.</p>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Bucătăria procesează gluten, lapte, ouă, susan și muștar. Pentru alergii severe, sună-ne înainte de comandă.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-page pt-6 pb-16 sm:pb-20">
          <SectionHeading id="related-title" eyebrow="Merge perfect cu" title="S-ar putea să-ți placă și" />
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page py-6 sm:py-10" aria-busy="true" aria-label="Se încarcă produsul">
      <div className="mb-5 h-4 w-64 animate-pulse rounded bg-sand" />
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-sand" />
        <div className="space-y-4">
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-sand" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-sand" />
          <div className="h-24 animate-pulse rounded-xl bg-sand" />
          <div className="h-40 animate-pulse rounded-2xl bg-sand" />
        </div>
      </div>
    </div>
  );
}
