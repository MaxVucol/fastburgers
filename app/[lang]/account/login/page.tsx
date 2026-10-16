import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame, guestOnly } from "@/components/account/auth-page";
import { AuthCard, SignInForm } from "@/components/account/forms";
import { GoogleButton, googleStartHref, OrDivider } from "@/components/account/google-button";
import { AccountSkeleton } from "@/components/account/shell";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.signIn.title, robots: { index: false } };
}

export default function SignInPage({ searchParams }: PageProps<"/[lang]/account/login">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/[lang]/account/login">, "searchParams">) {
  const [{ locale, t }, { next, expired, query }] = await Promise.all([getI18n(), guestOnly(searchParams)]);
  // Result of a Google round trip (see app/auth/google/callback): "exists" is guidance, the rest errors.
  const google = typeof query.google === "string" && GOOGLE_CODES.includes(query.google as GoogleCode) ? (query.google as GoogleCode) : null;
  const notice = google === "exists" ? t.me.google.exists : query.reset === "1" ? t.me.signIn.resetDone : expired ? t.me.signIn.expired : undefined;
  const error = google && google !== "exists" ? t.me.google[google] : undefined;
  return (
    <AuthFrame>
      <AuthCard title={t.me.signIn.title} lead={t.me.signIn.lead}>
        {/* Always offered; without GOOGLE_CLIENT_ID/SECRET /auth/google answers "unavailable". Hidden only
            while an existing account must first sign in with its password (google=exists). */}
        {google !== "exists" && (
          <>
            <GoogleButton href={googleStartHref("signin", locale, next)} label={t.me.google.continue} />
            <OrDivider label={t.me.google.or} />
          </>
        )}
        <SignInForm next={next} notice={notice} error={error} />
      </AuthCard>
    </AuthFrame>
  );
}

const GOOGLE_CODES = ["cancelled", "failed", "unavailable", "unverified", "exists", "notAllowed", "tooMany", "linkExpired"] as const;
type GoogleCode = (typeof GOOGLE_CODES)[number];
