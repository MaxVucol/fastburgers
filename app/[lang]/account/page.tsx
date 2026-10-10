import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { OrderLookupForm } from "@/components/checkout/order-lookup-form";
import { Spark } from "@/components/ui/brand";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.meta.accountTitle,
    description: t.meta.accountDescription,
    alternates: localeAlternates(locale, "/account"),
    robots: { index: false },
  };
}

export default async function AccountPage() {
  const { t } = await getI18n();
  return (
    <div className="container-page pt-10 pb-20 sm:pt-14 sm:pb-28">
      <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
        <Spark className="size-3.5 text-accent" />
        {t.account.eyebrow}
      </p>
      <h1 className="type-h1 mt-4 max-w-3xl">{t.account.title}</h1>
      <p className="mt-4 max-w-xl text-muted sm:text-lg">{t.account.lead}</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="track-title" className="border-t-2 border-ink pt-6">
          <h2 id="track-title" className="font-display text-2xl font-semibold uppercase">{t.account.trackTitle}</h2>
          <p className="mt-1 mb-6 text-sm text-muted">{t.account.trackText}</p>
          <div className="max-w-md">
            <OrderLookupForm />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-card)] bg-ink p-6 text-on-dark sm:p-7">
            <h2 className="font-display text-xl font-semibold uppercase">{t.account.helpTitle}</h2>
            <p className="mt-1 text-sm text-muted-on-dark">{t.account.helpText}</p>
            <a href={siteConfig.phoneHref} className="mt-4 inline-block font-display text-3xl font-semibold text-flame hover:underline">
              {siteConfig.phone}
            </a>
          </div>
          <Link
            href="/admin"
            className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-line p-5 text-sm transition-colors hover:border-ink/35"
          >
            <LockKeyhole className="size-5 text-muted" aria-hidden />
            <span className="flex-1">
              <span className="block font-semibold">{t.account.staffTitle}</span>
              <span className="text-muted">{t.account.staffText}</span>
            </span>
            <ArrowUpRight className="size-4 text-muted group-hover:text-ink" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  );
}
