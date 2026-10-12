import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm, ProfileForm } from "@/components/account/forms";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.profile.title, robots: { index: false } };
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const { t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/profile"))}`));
  return (
    <AccountShell user={user} active="profile" title={t.me.profile.title} lead={t.me.profile.lead}>
      <div className="grid gap-6 xl:grid-cols-2">
        <AccountPanel title={t.me.nav.profile}>
          <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
        </AccountPanel>
        <AccountPanel title={t.me.profile.passwordTitle}>
          <PasswordForm />
        </AccountPanel>
      </div>
    </AccountShell>
  );
}
