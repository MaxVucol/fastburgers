import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/account/auth-page";
import { AuthCard, VerifyForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.verify.title, robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Confirmation needs a button press, so link scanners in mail clients cannot use up the token. */
export default function VerifyEmailPage({ searchParams }: PageProps<"/[lang]/account/verify">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Verify searchParams={searchParams} />
    </Suspense>
  );
}

async function Verify({ searchParams }: Pick<PageProps<"/[lang]/account/verify">, "searchParams">) {
  const [{ t }, query] = await Promise.all([getI18n(), searchParams]);
  const token = typeof query.token === "string" ? query.token : "";
  return (
    <AuthFrame>
      <AuthCard title={t.me.verify.title} lead={token ? t.me.verify.lead : t.me.verify.invalid}>
        {token && <VerifyForm token={token} />}
      </AuthCard>
    </AuthFrame>
  );
}
