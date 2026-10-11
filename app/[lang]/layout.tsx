import type { Metadata, Viewport } from "next";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { fontVariables } from "@/lib/fonts";
import { intlLocale, locales, ogLocale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t.meta.title, template: `%s | ${siteConfig.name}` },
    description: t.meta.description,
    applicationName: siteConfig.name,
    keywords: t.meta.keywords.split(", "),
    openGraph: {
      type: "website",
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      siteName: siteConfig.name,
      title: t.meta.ogTitle,
      description: t.meta.description,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: t.meta.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitle,
      description: t.meta.description,
      images: [{ url: siteConfig.ogImage, alt: t.meta.ogImageAlt }],
    },
    // No default canonical/hreflang here: each indexable page declares its own, and
    // noindex pages (checkout, order status) must not point at the home page.
  };
}

export const viewport: Viewport = {
  themeColor: "#151515",
  colorScheme: "light",
};

export default async function SiteRootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();

  return (
    // The inline script sets data-theme (saved choice or system theme) before the first paint;
    // suppressHydrationWarning lets React keep that attribute.
    <html lang={intlLocale[locale]} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} dictionary={t}>
          <a
            href="#continut"
            className="sr-only z-[60] rounded-full bg-ink px-5 py-2.5 font-semibold text-on-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t.common.skipToContent}
          </a>
          <Header />
          <main id="continut" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </I18nProvider>
      </body>
    </html>
  );
}
