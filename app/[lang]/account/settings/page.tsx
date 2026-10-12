import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut, ShieldOff } from "lucide-react";
import { signOutAction, signOutEverywhereAction } from "@/actions/customer";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { ConfirmSubmit } from "@/components/account/confirm-submit";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.settings.title, robots: { index: false } };
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const { locale, t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/settings"))}`));
  return (
    <AccountShell user={user} active="settings" title={t.me.settings.title} lead={t.me.settings.lead}>
      <div className="space-y-6">
        <AccountPanel title={t.me.settings.logout}>
          <p className="text-sm text-muted">{t.me.settings.logoutText}</p>
          <form action={signOutAction} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="dark">
              <LogOut className="size-4.5" aria-hidden />
              {t.me.settings.logout}
            </Button>
          </form>
        </AccountPanel>
        <AccountPanel title={t.me.settings.logoutAll}>
          <p className="text-sm text-muted">{t.me.settings.logoutAllText}</p>
          <form action={signOutEverywhereAction} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <ConfirmSubmit message={t.me.settings.confirmAll}>
              <ShieldOff className="size-4.5" aria-hidden />
              {t.me.settings.logoutAll}
            </ConfirmSubmit>
          </form>
        </AccountPanel>
        <AccountPanel title={t.me.settings.deleteTitle}>
          <p className="text-sm text-muted">{fill(t.me.settings.deleteText, { email: siteConfig.email })}</p>
        </AccountPanel>
      </div>
    </AccountShell>
  );
}
