import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { cancelGoogleLinkAction } from "@/actions/customer";
import { AuthFrame } from "@/components/account/auth-page";
import { AuthCard, GoogleLinkForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
import { ButtonLink } from "@/components/ui/button";
import { GOOGLE_LINK_COOKIE, openGoogleCookie, type GoogleProfile } from "@/lib/auth/google";
import { requireUser } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.google.linkTitle, robots: { index: false, follow: false } };
}

/**
 * Confirms connecting a Google account (waiting in the signed link cookie) to the signed-in account.
 * Reached after "Connect Google" in the profile, or after signing in with the password when Google
 * found an existing account with the same e-mail. Nothing is linked until the password is entered.
 */
export default function LinkGooglePage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <LinkGoogle />
    </Suspense>
  );
}

async function LinkGoogle() {
  const { locale, t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/link-google"))}`));
  const pending = await openGoogleCookie<GoogleProfile & { uid?: string }>("link", (await cookies()).get(GOOGLE_LINK_COOKIE)?.value);
  const valid = pending && (!pending.uid || pending.uid === user.id);

  if (!valid || user.role !== "CUSTOMER") {
    return (
      <AuthFrame>
        <AuthCard title={t.me.google.linkTitle} lead={user.role !== "CUSTOMER" ? t.me.google.adminNote : t.me.google.linkExpired}>
          <ButtonLink href={href("/account/profile")} variant="dark">{t.me.nav.profile}</ButtonLink>
        </AuthCard>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame>
      <AuthCard title={t.me.google.linkTitle} lead={fill(t.me.google.linkLead, { google: pending.email, account: user.email })}>
        <GoogleLinkForm />
        <form action={cancelGoogleLinkAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="min-h-11 w-full text-sm font-semibold text-muted underline-offset-4 hover:underline">
            {t.me.google.linkCancel}
          </button>
        </form>
      </AuthCard>
    </AuthFrame>
  );
}
