import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/lib/site";
import "../globals.css";

// The admin area is its own root layout (the public site lives under app/[lang]).
// It stays in Romanian: it is an internal tool for the restaurant team.

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Administrare", template: "%s · Admin Fast Burgers" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e7",
  colorScheme: "light",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ro-RO" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex min-h-full flex-1 flex-col bg-cream">{children}</div>
      </body>
    </html>
  );
}
