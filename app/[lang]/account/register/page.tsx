import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame, guestOnly } from "@/components/account/auth-page";
import { AuthCard, RegisterForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
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
  const [{ t }, { next }] = await Promise.all([getI18n(), guestOnly(searchParams)]);
  return (
    <AuthFrame>
      <AuthCard title={t.me.register.title} lead={t.me.register.lead}>
        <RegisterForm next={next} />
      </AuthCard>
    </AuthFrame>
  );
}
