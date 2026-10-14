import type { Metadata, Viewport } from "next";
import { InlineScript } from "@/components/inline-script";
import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "../globals.css";

// The admin area is its own root layout (the public site lives under app/[lang]). Its language is
// chosen in the panel (cookie, see lib/i18n/admin) and set on the panel's own wrapper, so this
// shell stays static; the theme is the same light / dark choice as on the site.

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Admin BUNIQ", template: "%s · Admin BUNIQ" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e7",
  colorScheme: "light",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    // The inline script sets data-theme (saved choice or system theme) before the first paint;
    // suppressHydrationWarning lets React keep that attribute.
    <html lang="ro-RO" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="flex min-h-full flex-1 flex-col bg-cream">{children}</div>
      </body>
    </html>
  );
}
