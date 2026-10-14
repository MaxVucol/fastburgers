import Link from "next/link";
import { Suspense } from "react";
import { AdminI18nProvider } from "@/components/admin/admin-i18n";
import { AdminPreferences } from "@/components/admin/admin-preferences";
import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/layout/logo";
import { intlLocale } from "@/lib/i18n/admin";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";

export const generateMetadata = () => adminTitle("login");

/** Reads the panel language (cookie): request-time content inside Suspense. */
async function LoginScreen() {
  const { locale, a } = await getAdminI18n();
  return (
    <AdminI18nProvider locale={locale} dictionary={a}>
      <main lang={intlLocale[locale]} className="relative flex flex-1 items-center justify-center px-4 pt-20 pb-16">
        <AdminPreferences className="absolute top-4 right-4" />
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark className="size-12" />
            <h1 className="mt-4 text-2xl font-extrabold">{a.login.title}</h1>
            <p className="mt-1 text-sm text-muted">{a.login.lead}</p>
          </div>
          <div className="rounded-2xl bg-paper p-6 shadow-[var(--shadow-soft)] ring-1 ring-line">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-muted hover:text-ink">
              {a.login.back}
            </Link>
          </p>
        </div>
      </main>
    </AdminI18nProvider>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <LoginScreen />
    </Suspense>
  );
}
