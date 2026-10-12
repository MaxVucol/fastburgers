import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame, guestOnly } from "@/components/account/auth-page";
import { AuthCard, SignInForm } from "@/components/account/forms";
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
  const [{ t }, { next, expired, query }] = await Promise.all([getI18n(), guestOnly(searchParams)]);
  const notice = query.reset === "1" ? t.me.signIn.resetDone : expired ? t.me.signIn.expired : undefined;
  return (
    <AuthFrame>
      <AuthCard title={t.me.signIn.title} lead={t.me.signIn.lead}>
        <SignInForm next={next} notice={notice} />
      </AuthCard>
    </AuthFrame>
  );
}
