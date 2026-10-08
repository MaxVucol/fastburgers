import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { requireAdmin } from "@/lib/auth/session";

/** Authorises the request (DB-backed) before any admin content renders. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

async function AdminUserBadge() {
  const admin = await requireAdmin();
  return (
    <span className="hidden text-sm text-muted sm:inline">
      {admin.name} · <span className="text-ink-soft">{admin.email}</span>
    </span>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="border-b border-line bg-ivory lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
          <Logo />
        </div>
        <nav aria-label="Administrare" className="px-3 pb-3 lg:flex-1 lg:px-3">
          <AdminNav />
        </nav>
        <div className="hidden space-y-1 border-t border-line p-3 lg:block">
          <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sand">
            <ExternalLink className="size-4.5" aria-hidden /> Vezi site-ul
          </Link>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sand">
              <LogOut className="size-4.5" aria-hidden /> Deconectare
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-cream/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <Suspense fallback={<span className="h-5 w-40 animate-pulse rounded bg-sand" />}>
            <AdminUserBadge />
          </Suspense>
          <form action={logout} className="ml-auto lg:hidden">
            <button type="submit" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-sand">
              <LogOut className="size-4" aria-hidden /> Ieșire
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-24 text-muted" aria-busy="true">
                <Loader2 className="size-6 animate-spin" aria-label="Se încarcă" />
              </div>
            }
          >
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
