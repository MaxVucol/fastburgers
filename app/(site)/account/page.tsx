import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, PackageSearch } from "lucide-react";
import { OrderLookupForm } from "@/components/checkout/order-lookup-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contul meu",
  description: "Urmărește statusul comenzii Fast Burgers.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <h1 className="text-4xl leading-[1.02] font-extrabold sm:text-5xl">Contul meu</h1>
      <p className="mt-3 max-w-xl text-muted">
        Comanzi fără cont — e mai rapid. Ai nevoie doar de numărul comenzii și de telefon ca să vezi în ce stadiu e.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="track-title" className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <PackageSearch className="size-8 text-accent" aria-hidden />
          <h2 id="track-title" className="mt-3 text-xl font-extrabold">Urmărește comanda</h2>
          <p className="mt-1 mb-5 text-sm text-muted">Numărul comenzii apare pe ecranul de confirmare.</p>
          <OrderLookupForm />
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-sand p-6">
            <h2 className="font-bold">Ai nevoie de ajutor?</h2>
            <p className="mt-1 text-sm text-muted">Suntem la telefon în timpul programului.</p>
            <a href={siteConfig.phoneHref} className="mt-3 inline-block font-display text-xl font-extrabold hover:text-accent">
              {siteConfig.phone}
            </a>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-2xl bg-white p-5 text-sm ring-1 ring-line hover:ring-ink/20"
          >
            <LockKeyhole className="size-5 text-muted" aria-hidden />
            <span>
              <span className="block font-bold">Personal restaurant</span>
              <span className="text-muted">Autentificare în panoul de administrare</span>
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
