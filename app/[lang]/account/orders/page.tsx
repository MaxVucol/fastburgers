import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderRows } from "@/components/account/order-bits";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { listUserOrders } from "@/services/customer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.orders.title, robots: { index: false } };
}

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const { locale, t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/orders"))}`));
  const orders = await listUserOrders(user.id);
  return (
    <AccountShell user={user} active="orders" title={t.me.orders.title} lead={t.me.orders.lead}>
      <AccountPanel>
        {orders.length === 0 ? <p className="text-muted">{t.me.orders.empty}</p> : <OrderRows orders={orders} locale={locale} t={t} href={href} />}
      </AccountPanel>
      <p className="mt-4 text-sm text-muted">
        {t.me.orders.guestNote}{" "}
        <Link href={href("/account")} className="font-semibold text-accent-ink hover:underline">
          {t.account.trackTitle}
        </Link>
      </p>
    </AccountShell>
  );
}
