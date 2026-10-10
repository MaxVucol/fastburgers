import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductList } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { fill, plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { getCategories } from "@/services/catalog";
import { getLocalizedCategory, getMenu } from "@/services/localized-catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/categorii/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale, t }] = await Promise.all([params, getI18n()]);
  const category = await getLocalizedCategory(slug, locale);
  if (!category) return { title: t.meta.categoryUnavailable, robots: { index: false } };
  return {
    title: fill(t.meta.categoryTitle, { name: category.name }),
    description: fill(t.meta.categoryDescription, { description: category.description }),
    alternates: localeAlternates(locale, `/categorii/${category.slug}`),
    openGraph: {
      title: `${category.name} | Fast Burgers`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default function CategoryPage({ params }: PageProps<"/[lang]/categorii/[slug]">) {
  return (
    <div className="container-page pt-8 pb-20 sm:pt-12 sm:pb-28">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-panel)] bg-sand" aria-busy="true" />}>
        <CategoryContent params={params} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/[lang]/categorii/[slug]">["params"] }) {
  const [{ slug }, { locale, t, href }] = await Promise.all([params, getI18n()]);
  const { categories, products } = await getMenu(locale);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const items = products.filter((p) => p.categorySlug === slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: href("/"), label: t.common.home },
          { href: href("/menu"), label: t.common.menu },
          { label: category.name },
        ]}
      />
      <header className="mb-8 grid gap-4 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
        <h1 className="type-h1">{category.name}</h1>
        <div className="lg:pb-2">
          <p className="text-muted sm:text-lg">{category.description}</p>
          <p className="mt-2 text-sm font-semibold text-ink-soft">{plural(locale, items.length, t.categories.count)}</p>
        </div>
      </header>
      <nav aria-label={t.menu.otherCategories} className="mb-10 border-b border-line">
        <div className="no-scrollbar -mx-[var(--gutter)] flex gap-6 overflow-x-auto px-[var(--gutter)] sm:mx-0 sm:gap-7 sm:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href(`/categorii/${c.slug}`)}
              aria-current={c.slug === slug ? "page" : undefined}
              className={cn(
                "relative inline-flex h-12 shrink-0 items-center text-[0.9375rem] font-semibold whitespace-nowrap transition-colors",
                "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-accent after:transition-transform",
                c.slug === slug ? "text-ink after:scale-x-100" : "text-muted after:scale-x-0 hover:text-ink",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
      <ProductList products={items} eagerCount={4} />
    </>
  );
}
