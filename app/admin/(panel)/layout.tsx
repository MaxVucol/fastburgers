import Link from "next/link";
import { Suspense } from "react";
import { Bell, ExternalLink, Loader2, LogOut, Search } from "lucide-react";
import { logout } from "@/actions/auth";
import { AdminI18nProvider } from "@/components/admin/admin-i18n";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPreferences } from "@/components/admin/admin-preferences";
import { AdminMobileNav, AdminProfileMenu } from "@/components/admin/admin-shell";
import { Logo, LogoMark } from "@/components/layout/logo";
import { requireAdmin } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { intlLocale } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";
import { cn } from "@/lib/utils";
import { countNewOrders } from "@/services/admin-dashboard";

/**
 * The panel frame. It authorises the request (DB-backed) before anything renders and reads the
 * panel language (a cookie), so it is request-time content inside Suspense.
 */
async function AdminFrame({ children }: { children: React.ReactNode }) {
  const [admin, { locale, a }] = await Promise.all([requireAdmin(), getAdminI18n()]);
  const newOrders = await countNewOrders();
  const sideLink = "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink";
  return (
    <AdminI18nProvider locale={locale} dictionary={a}>
      <div lang={intlLocale[locale]} className="flex min-h-full flex-1">
        <aside className="hidden border-r border-line bg-ivory lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
          <div className="px-6 pt-6 pb-5">
            <Logo href="/admin" />
          </div>
          <nav aria-label={a.shell.navLabel} className="flex-1 overflow-y-auto px-3">
            <AdminNav newOrders={newOrders} />
          </nav>
          <div className="space-y-1 border-t border-line p-3">
            <Link href="/" target="_blank" className={sideLink}>
              <ExternalLink className="size-[1.125rem] text-muted" aria-hidden /> {a.shell.viewSite}
            </Link>
            <form action={logout}>
              <button type="submit" className={cn(sideLink, "w-full")}>
                <LogOut className="size-[1.125rem] text-muted" aria-hidden /> {a.shell.logout}
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
            <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
              <AdminMobileNav newOrders={newOrders} />
              <Link href="/admin" className="lg:hidden" aria-label="BUNIQ">
                <LogoMark className="size-9" />
              </Link>
              {/* Searches orders (number, customer name, phone) — the order list does the lookup. */}
              <form action="/admin/orders" role="search" className="relative hidden max-w-md flex-1 md:block">
                <label htmlFor="admin-search" className="sr-only">{a.ui.searchLabel}</label>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="admin-search"
                  name="q"
                  type="search"
                  placeholder={a.ui.searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-line bg-paper pr-3 pl-9 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </form>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <Link
                  href="/admin/orders?status=NEW"
                  className="relative grid size-10 place-items-center rounded-lg border border-line bg-paper text-ink-soft hover:text-ink"
                  aria-label={newOrders > 0 ? fill(a.ui.notifications, { count: newOrders }) : a.ui.noNotifications}
                  title={newOrders > 0 ? fill(a.ui.notifications, { count: newOrders }) : a.ui.noNotifications}
                >
                  <Bell className="size-[1.125rem]" aria-hidden strokeWidth={1.9} />
                  {newOrders > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-accent px-1 text-center text-[0.6875rem] leading-5 font-bold text-on-accent ring-2 ring-cream tabular-nums">
                      {newOrders > 99 ? "99+" : newOrders}
                    </span>
                  )}
                </Link>
                <AdminPreferences className="hidden sm:flex" />
                <AdminProfileMenu name={admin.name} email={admin.email} />
              </div>
            </div>
            {/* Phones: search and preferences on their own row. */}
            <div className="flex items-center gap-2 px-4 pb-3 md:hidden">
              <form action="/admin/orders" role="search" className="relative flex-1">
                <label htmlFor="admin-search-m" className="sr-only">{a.ui.searchLabel}</label>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="admin-search-m"
                  name="q"
                  type="search"
                  placeholder={a.ui.searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-line bg-paper pr-3 pl-9 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </form>
              <AdminPreferences className="sm:hidden" />
            </div>
          </header>
          <main className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
