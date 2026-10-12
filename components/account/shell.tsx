import Link from "next/link";
import type { ReactNode } from "react";
import { Heart, LayoutGrid, LogOut, MapPin, Package, Settings, UserRound } from "lucide-react";
import { signOutAction } from "@/actions/customer";
import { ResendVerification } from "@/components/account/forms";
import { Crown } from "@/components/ui/brand";
import type { SessionUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export type AccountSection = "overview" | "orders" | "profile" | "addresses" | "favorites" | "settings";

const sections: { key: AccountSection; path: string; icon: typeof Heart }[] = [
  { key: "overview", path: "/account", icon: LayoutGrid },
  { key: "orders", path: "/account/orders", icon: Package },
  { key: "profile", path: "/account/profile", icon: UserRound },
  { key: "addresses", path: "/account/addresses", icon: MapPin },
  { key: "favorites", path: "/account/favorites", icon: Heart },
  { key: "settings", path: "/account/settings", icon: Settings },
];

/**
 * Frame of the signed-in account pages: page title, the section navigation (a scrollable row of
 * pills on phones, a sticky column on desktop) and the e-mail confirmation reminder.
 */
export async function AccountShell({
  user,
  active,
  title,
  lead,
  children,
}: {
  user: SessionUser;
  active: AccountSection;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  const { locale, t, href } = await getI18n();
  return (
    <div className="container-page pt-8 pb-20 sm:pt-12 sm:pb-28">
      <p className="type-eyebrow flex items-center gap-2 text-ink-soft">
        <Crown className="h-3.5 text-accent-ink" />
        {t.me.nav.label}
      </p>
      <h1 className="type-h1 mt-3 max-w-3xl">{title}</h1>
      {lead && <p className="mt-3 max-w-xl text-muted sm:text-lg">{lead}</p>}

      {!user.emailVerified && (
        <div className="mt-6 rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-3 text-sm">
          <ResendVerification />
        </div>
      )}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:mt-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label={t.me.nav.label} className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <ul className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {sections.map(({ key, path, icon: Icon }) => {
              const current = key === active;
              return (
                <li key={key} className="shrink-0">
                  <Link
                    href={href(path)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-[var(--duration-fast)] lg:rounded-[var(--radius-sm)] lg:border-transparent",
                      current ? "border-ink bg-ink text-on-ink" : "border-line text-ink-soft hover:border-ink/35 hover:text-ink lg:hover:bg-sand",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden />
                    {t.me.nav[key]}
                  </Link>
                </li>
              );
            })}
            <li className="shrink-0 lg:mt-3 lg:border-t lg:border-line lg:pt-3">
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-full border border-line px-4 text-sm font-semibold whitespace-nowrap text-ink-soft transition-colors hover:border-ink/35 hover:text-ink lg:rounded-[var(--radius-sm)] lg:border-transparent lg:hover:bg-sand"
                >
                  <LogOut className="size-4.5 shrink-0" aria-hidden />
                  {t.me.nav.logout}
                </button>
              </form>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function AccountPanel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-line bg-paper p-5 sm:p-6", className)}>
      {title && <h2 className="mb-4 font-display text-xl font-extrabold tracking-[-0.02em]">{title}</h2>}
      {children}
    </section>
  );
}

/** Pulse placeholder shown while the session is checked. */
export function AccountSkeleton() {
  return (
    <div className="container-page pt-8 pb-20 sm:pt-12" aria-busy="true">
      <div className="h-4 w-32 animate-pulse rounded bg-sand" />
      <div className="mt-4 h-12 w-72 max-w-full animate-pulse rounded bg-sand" />
      <div className="mt-10 h-80 animate-pulse rounded-[var(--radius-card)] bg-sand" />
    </div>
  );
}
