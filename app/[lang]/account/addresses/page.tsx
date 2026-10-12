import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { deleteAddressAction } from "@/actions/customer";
import { AddressForm } from "@/components/account/forms";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { listAddresses } from "@/services/customer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.addresses.title, robots: { index: false } };
}

export default function AccountAddressesPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Addresses />
    </Suspense>
  );
}

async function Addresses() {
  const { locale, t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/addresses"))}`));
  const addresses = await listAddresses(user.id);
  return (
    <AccountShell user={user} active="addresses" title={t.me.addresses.title} lead={t.me.addresses.lead}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AccountPanel>
          {addresses.length === 0 ? (
            <p className="text-muted">{t.me.addresses.empty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.label}</p>
                    <p className="text-sm break-words text-muted">{a.address}</p>
                  </div>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                      aria-label={fill(t.me.addresses.remove, { label: a.label })}
                    >
                      <Trash2 className="size-4.5" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </AccountPanel>
        <AccountPanel title={t.me.addresses.add}>
          <AddressForm />
        </AccountPanel>
      </div>
    </AccountShell>
  );
}
