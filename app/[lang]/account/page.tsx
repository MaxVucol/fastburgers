import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, Heart, LockKeyhole, MapPin, Package, UserRound } from "lucide-react";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { OrderRows } from "@/components/account/order-bits";
import { OrderLookupForm } from "@/components/checkout/order-lookup-form";
import { Crown } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { getI18n, localeAlternates } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { listUserOrders } from "@/services/customer";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.me.nav.label,
    description: t.meta.accountDescription,
    alternates: localeAlternates(locale, "/account"),
    robots: { index: false },
  };
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountHome />
    </Suspense>
  );
}

async function AccountHome() {
  const user = await getSessionUser();
  if (!user) return <GuestAccount />;
  const { locale, t, href } = await getI18n();
  const orders = await listUserOrders(user.id, 3);
  const quick = [
    { path: "/account/orders", label: t.me.nav.orders, icon: Package },
    { path: "/account/profile", label: t.me.nav.profile, icon: UserRound },
    { path: "/account/addresses", label: t.me.nav.addresses, icon: MapPin },
    { path: "/account/favorites", label: t.me.nav.favorites, icon: Heart },
  ];
  return (
    <AccountShell user={user} active="overview" title={fill(t.me.overview.hello, { name: user.name.split(" ")[0] ?? user.name })} lead={t.me.overview.lead}>
      <div className="space-y-6">
        <AccountPanel title={t.me.overview.recent}>
          {orders.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted">{t.me.overview.noOrders}</p>
              <ButtonLink href={href("/menu")} size="md">
                {t.me.overview.browse}
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          ) : (
            <>
              <OrderRows orders={orders} locale={locale} t={t} href={href} />
              <Link href={href("/account/orders")} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-ink hover:underline">
                {t.me.overview.viewAll}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </AccountPanel>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quick.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                href={href(path)}
                className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-paper p-4 font-semibold transition-colors hover:border-ink/35"
              >
                <Icon className="size-5 text-accent-ink" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AccountShell>
  );
}

/** Not signed in: sign in / sign up, and order tracking by number and phone (works without an account). */
async function GuestAccount() {
  const { t, href } = await getI18n();
  return (
    <div className="container-page pt-10 pb-20 sm:pt-14 sm:pb-28">
      <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
        <Crown className="h-3.5 text-accent-ink" />
        {t.me.guest.eyebrow}
      </p>
      <h1 className="type-h1 mt-4 max-w-3xl">{t.me.guest.title}</h1>
      <p className="mt-4 max-w-xl text-muted sm:text-lg">{t.me.guest.lead}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <ButtonLink href={href("/account/login")} size="lg">
          {t.me.guest.signIn}
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href={href("/account/register")} size="lg" variant="outline">
          {t.me.guest.register}
        </ButtonLink>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="track-title" className="border-t-2 border-ink pt-6">
          <h2 id="track-title" className="font-display text-2xl font-extrabold tracking-[-0.02em]">{t.account.trackTitle}</h2>
          <p className="mt-1 mb-6 text-sm text-muted">{t.account.trackText}</p>
          <div className="max-w-md">
            <OrderLookupForm />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-card)] bg-graphite p-6 text-on-dark sm:p-7">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">{t.account.helpTitle}</h2>
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
