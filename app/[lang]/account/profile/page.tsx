import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailChangeForm, FormMessage, GoogleUnlinkForm, PasswordForm, ProfileForm } from "@/components/account/forms";
import { GoogleButton, googleStartHref } from "@/components/account/google-button";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { readGoogleConfig } from "@/lib/auth/google";
import { requireUser } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { googleAccountOf } from "@/services/oauth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.profile.title, robots: { index: false } };
}

export default function AccountProfilePage({ searchParams }: PageProps<"/[lang]/account/profile">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}

/** Results of the Google round trip and of the link confirmation (?google=…). */
const NOTICES = ["linked", "alreadyLinked"] as const;
const ERRORS = ["cancelled", "failed", "unavailable", "unverified", "notAllowed", "tooMany", "linkExpired"] as const;

async function Profile({ searchParams }: Pick<PageProps<"/[lang]/account/profile">, "searchParams">) {
  const [{ locale, t, href }, query] = await Promise.all([getI18n(), searchParams]);
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/profile"))}`));
  const google = user.role === "CUSTOMER" ? await googleAccountOf(user.id) : null;
  const code = typeof query.google === "string" ? query.google : "";
  const message = (NOTICES as readonly string[]).includes(code)
    ? { notice: t.me.google[code as (typeof NOTICES)[number]] }
    : (ERRORS as readonly string[]).includes(code)
      ? { error: t.me.google[code as (typeof ERRORS)[number]] }
      : null;
  const googleOn = Boolean(readGoogleConfig());

  return (
    <AccountShell user={user} active="profile" title={t.me.profile.title} lead={t.me.profile.lead}>
      <div className="grid gap-6 xl:grid-cols-2">
        <AccountPanel title={t.me.nav.profile}>
          <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
        </AccountPanel>
        <AccountPanel title={t.me.profile.passwordTitle}>
          <PasswordForm />
        </AccountPanel>
        <AccountPanel title={t.me.emailChange.title}>
          <EmailChangeForm />
        </AccountPanel>
        {(googleOn || google || message) && (
          <AccountPanel title={t.me.google.profileTitle}>
            <div className="space-y-4">
              {message && <FormMessage state={message} />}
              {user.role !== "CUSTOMER" ? (
                <p className="text-sm text-muted">{t.me.google.adminNote}</p>
              ) : google ? (
                <>
                  <p className="font-medium">{fill(t.me.google.connectedAs, { email: google.email })}</p>
                  <GoogleUnlinkForm />
                </>
              ) : googleOn ? (
                <>
                  <p className="text-sm text-muted">{t.me.google.notConnected}</p>
                  <GoogleButton href={googleStartHref("link", locale)} label={t.me.google.connect} className="sm:w-auto" />
                </>
              ) : (
                <p className="text-sm text-muted">{t.me.google.unavailable}</p>
              )}
            </div>
          </AccountPanel>
        )}
      </div>
    </AccountShell>
  );
}
