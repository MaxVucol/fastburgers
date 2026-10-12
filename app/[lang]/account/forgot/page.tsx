import type { Metadata } from "next";
import { AuthFrame } from "@/components/account/auth-page";
import { AuthCard, ForgotForm } from "@/components/account/forms";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.forgot.title, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthFrame>
      <AuthCard title={t.me.forgot.title} lead={t.me.forgot.lead}>
        <ForgotForm />
      </AuthCard>
    </AuthFrame>
  );
}
