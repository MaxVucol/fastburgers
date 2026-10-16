import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MenuExplorer } from "@/components/menu/menu-explorer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { fill, plural } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
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
      title: `${category.name} | ${siteConfig.name}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default function CategoryPage({ params }: PageProps<"/[lang]/categorii/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page pt-8 sm:pt-12"><div className="h-96 animate-pulse rounded-[var(--radius-panel)] bg-sand" aria-busy="true" /></div>}>
      <CategoryContent params={params} />
    </Suspense>
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
      <div className="container-page pt-8 sm:pt-12">
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
      </div>

      {/* The same search, filters and sorting as the menu, working on this category in the browser. */}
      <MenuExplorer products={items} categories={categories} categorySlug={slug} path={href(`/categorii/${slug}`)} />
    </>
  );
}
