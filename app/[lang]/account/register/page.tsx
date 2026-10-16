import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame, guestOnly } from "@/components/account/auth-page";
import { AuthCard, RegisterForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
import { GoogleButton, googleStartHref, OrDivider } from "@/components/account/google-button";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.register.title, robots: { index: false } };
}

export default function RegisterPage({ searchParams }: PageProps<"/[lang]/account/register">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Register searchParams={searchParams} />
    </Suspense>
  );
}

async function Register({ searchParams }: Pick<PageProps<"/[lang]/account/register">, "searchParams">) {
  const [{ locale, t }, { next }] = await Promise.all([getI18n(), guestOnly(searchParams)]);
  return (
    <AuthFrame>
      <AuthCard title={t.me.register.title} lead={t.me.register.lead}>
        {/* Always offered; without GOOGLE_CLIENT_ID/SECRET /auth/google answers "unavailable". */}
        <GoogleButton href={googleStartHref("signin", locale, next)} label={t.me.google.continue} />
        <OrDivider label={t.me.google.or} />
        <RegisterForm next={next} />
      </AuthCard>
    </AuthFrame>
  );
}
