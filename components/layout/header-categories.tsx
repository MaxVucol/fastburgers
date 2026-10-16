"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { CategoryTabs, type CategoryTab } from "@/components/menu/category-tabs";
import { localeNames, splitLocale } from "@/lib/i18n/config";
import { LocaleFlag } from "./flags";
import { useLocaleLinks } from "./language-switcher";
import { WithPathname } from "./nav-links";

function Row({
  pathname,
  categories,
  tone,
  withLanguages,
  languageClassName,
}: {
  pathname: string;
  categories: { slug: string; name: string }[];
  tone: "page" | "dark";
  withLanguages: boolean;
  languageClassName?: string;
}) {
  const { t, href } = useI18n();
  const languages = useLocaleLinks(pathname);
  const current = languages.find((l) => l.active);
  const open = /^\/categorii\/([^/]+)/.exec(splitLocale(pathname).path)?.[1] ?? null;
  const tabs: CategoryTab[] = [
    { key: "all", href: href("/menu"), label: t.menu.allCategories },
    ...categories.map((c) => ({ key: c.slug, href: href(`/categorii/${c.slug}`), label: c.name })),
  ];
  // The language sits beside the swipe row, not in it.
  const aside: CategoryTab | undefined =
    withLanguages && current
      ? {
            key: "lang",
            href: current.href,
            label: localeNames[current.locale].native,
            icon: <LocaleFlag locale={current.locale} />,
            selected: true,
            className: languageClassName,
            lang: current.locale,
            onClick: current.onClick,
            menu: languages
              .filter((l) => !l.active)
              .map((l) => ({
                key: `lang-${l.locale}`,
                href: l.href,
                label: localeNames[l.locale].native,
                icon: <LocaleFlag locale={l.locale} />,
                lang: l.locale,
                onClick: l.onClick,
              })),
        }
      : undefined;
  return <CategoryTabs label={t.menu.categoriesLabel} tabs={tabs} aside={aside} activeKey={open} tone={tone} />;
}

/**
 * The category row of the site header (on every page): "all categories" plus each category with its
 * picture, and — on desktop — the current language (flag and name) at the end, with the other languages in a card on hover. The line sits under
 * the category whose page is open; the same instance lives across navigations, so the line slides
 * from one category to the next.
 */
export function HeaderCategories({
  categories,
  tone,
  withLanguages = false,
  languageClassName,
}: {
  categories: { slug: string; name: string }[];
  tone: "page" | "dark";
  withLanguages?: boolean;
  /** Classes on the language item (e.g. `md:hidden` where the header already has a language switcher). */
  languageClassName?: string;
}) {
  return (
    <WithPathname>
      {(pathname) => <Row pathname={pathname} categories={categories} tone={tone} withLanguages={withLanguages} languageClassName={languageClassName} />}
    </WithPathname>
  );
}
