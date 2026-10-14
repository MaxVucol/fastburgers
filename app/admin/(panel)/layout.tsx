import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { AdminI18nProvider } from "@/components/admin/admin-i18n";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPreferences } from "@/components/admin/admin-preferences";
import { Logo } from "@/components/layout/logo";
import { requireAdmin } from "@/lib/auth/session";
import { intlLocale } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";

/**
 * The panel frame. It authorises the request (DB-backed) before anything renders and reads the
 * panel language (a cookie), so it is request-time content inside Suspense.
 */
async function AdminFrame({ children }: { children: React.ReactNode }) {
  const [admin, { locale, a }] = await Promise.all([requireAdmin(), getAdminI18n()]);
  return (
    <AdminI18nProvider locale={locale} dictionary={a}>
      <div lang={intlLocale[locale]} className="flex min-h-full flex-1 flex-col lg:flex-row">
        <aside className="border-b border-line bg-ivory lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
            <Logo />
          </div>
          <nav aria-label={a.shell.navLabel} className="px-3 pb-3 lg:flex-1 lg:px-3">
            <AdminNav />
          </nav>
          <div className="hidden space-y-1 border-t border-line p-3 lg:block">
            <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sand">
              <ExternalLink className="size-4.5" aria-hidden /> {a.shell.viewSite}
            </Link>
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sand">
                <LogOut className="size-4.5" aria-hidden /> {a.shell.logout}
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-line bg-cream/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <span className="hidden min-w-0 truncate text-sm text-muted sm:inline">
              {admin.name} · <span className="text-ink-soft">{admin.email}</span>
            </span>
            <AdminPreferences className="ml-auto" />
            <form action={logout} className="lg:hidden">
              <button type="submit" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-sand">
                <LogOut className="size-4" aria-hidden /> {a.shell.logoutShort}
              </button>
            </form>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageLoading label={a.shell.loading} />}>{children}</Suspense>
          </main>
        </div>
      </div>
    </AdminI18nProvider>
  );
}

function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-24 text-muted" aria-busy="true">
      <Loader2 className="size-6 animate-spin" aria-label={label} />
    </div>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<PageLoading label="…" />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
