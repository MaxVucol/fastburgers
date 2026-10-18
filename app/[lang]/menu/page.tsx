import type { Metadata } from "next";
import { MenuExplorer } from "@/components/menu/menu-explorer";
import { Crown } from "@/components/ui/brand";
import { plural } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { getMenu } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.meta.menuTitle,
    description: t.meta.menuDescription,
    alternates: localeAlternates(locale, "/menu"),
    // A page-level openGraph replaces the layout's one entirely, so the card is repeated here.
    openGraph: {
      title: t.meta.menuTitle,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: t.meta.ogImageAlt }],
    },
  };
}

export default async function MenuPage() {
  const { locale, t, href } = await getI18n();
  // Cached reads: the whole menu is part of the static page, and the browser filters it from there
  // (no request per filter, sort or search key).
  const { categories, products } = await getMenu(locale);

  return (
    <>
      <header className="container-page pt-10 pb-8 sm:pt-14 sm:pb-10">
        <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
          <Crown className="h-3.5 text-accent-ink" />
          {t.menu.eyebrow}
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-end">
          <h1 className="type-h1">{t.menu.title}</h1>
          {/* The long sentence under the title is dropped on phones. */}
          <p className="hidden text-muted sm:block sm:text-lg lg:pb-2">{plural(locale, products.length, t.menu.lead)}</p>
        </div>
      </header>

      <MenuExplorer products={products} categories={categories} path={href("/menu")} />
    </>
  );
}
