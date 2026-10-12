import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFrame } from "@/components/account/auth-page";
import { AuthCard, ResetForm } from "@/components/account/forms";
import { AccountSkeleton } from "@/components/account/shell";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // The token travels in the URL: keep it out of referrers and indexes.
  return { title: t.me.reset.title, robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/[lang]/account/reset">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

async function Reset({ searchParams }: Pick<PageProps<"/[lang]/account/reset">, "searchParams">) {
  const [{ t, href }, query] = await Promise.all([getI18n(), searchParams]);
  const token = typeof query.token === "string" ? query.token : "";
  return (
    <AuthFrame>
      <AuthCard title={t.me.reset.title} lead={t.me.reset.lead}>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="text-muted">
            {t.me.reset.invalid}{" "}
            <Link href={href("/account/forgot")} className="font-semibold text-accent-ink hover:underline">
              {t.me.reset.requestNew}
            </Link>
          </p>
        )}
      </AuthCard>
    </AuthFrame>
  );
}
