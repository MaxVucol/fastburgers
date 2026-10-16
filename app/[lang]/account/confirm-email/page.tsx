import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/account/auth-page";
import { AuthCard, ConfirmEmailChangeForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.emailChange.confirmTitle, robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Link from the e-mail sent to the new address. A button press confirms it (see VerifyEmailPage). */
export default function ConfirmEmailPage({ searchParams }: PageProps<"/[lang]/account/confirm-email">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Confirm searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirm({ searchParams }: Pick<PageProps<"/[lang]/account/confirm-email">, "searchParams">) {
  const [{ t }, query] = await Promise.all([getI18n(), searchParams]);
  const token = typeof query.token === "string" ? query.token : "";
  return (
    <AuthFrame>
      <AuthCard title={t.me.emailChange.confirmTitle} lead={token ? t.me.emailChange.confirmLead : t.me.emailChange.invalid}>
        {token && <ConfirmEmailChangeForm token={token} />}
      </AuthCard>
    </AuthFrame>
  );
}
