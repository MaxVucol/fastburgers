import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/services/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categorii/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categorie indisponibilă", robots: { index: false } };
  return {
    title: `${category.name} — comandă online`,
    description: `${category.description} Vezi prețurile și comandă ${category.name.toLowerCase()} online de la Fast Burgers.`,
    alternates: { canonical: `/categorii/${category.slug}` },
    openGraph: {
      title: `${category.name} | Fast Burgers`,
      url: `/categorii/${category.slug}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default function CategoryPage({ params }: PageProps<"/categorii/[slug]">) {
  return (
    <div className="container-page py-8 sm:py-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-sand" aria-busy="true" />}>
        <CategoryContent params={params} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/categorii/[slug]">["params"] }) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();
  const products = await getProductsByCategory(slug);

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Acasă" }, { href: "/menu", label: "Meniu" }, { label: category.name }]} />
      <header className="mb-6 max-w-2xl">
        <h1 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">{category.name}</h1>
        <p className="mt-3 text-muted sm:text-lg">{category.description}</p>
      </header>
      <nav aria-label="Alte categorii" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categorii/${c.slug}`}
            aria-current={c.slug === slug ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold",
              c.slug === slug ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-sand",
            )}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <ProductGrid products={products} eagerCount={4} />
    </>
  );
}
