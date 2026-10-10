import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/layout/logo";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

// Fallback for URLs that match no route at all (the site has two root layouts:
// app/[lang] and app/admin). Localized 404s live in app/[lang]/not-found.tsx.

export const metadata: Metadata = {
  title: "404 — BUNIQ",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ro-RO" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-cream px-6 py-24 text-center">
        <Wordmark className="mb-10 text-[2.25rem]" />
        <p className="type-hero text-accent-ink">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Pagina asta s-a mâncat.</h1>
        <p className="mt-2 text-muted">Эту страницу уже съели. · This page has been eaten.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-ink hover:bg-accent-hover"
        >
          BUNIQ
        </Link>
      </body>
    </html>
  );
}
