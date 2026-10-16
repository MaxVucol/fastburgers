"use client";

import Link from "next/link";
import { ClipboardList, FolderTree, History, LayoutDashboard, Scale, Users, UtensilsCrossed } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { WithPathname } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", key: "orders", icon: ClipboardList },
  { href: "/admin/products", key: "products", icon: UtensilsCrossed },
  { href: "/admin/categories", key: "categories", icon: FolderTree },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/market", key: "market", icon: Scale },
  { href: "/admin/audit", key: "audit", icon: History },
] as const;

function AdminNavView({ pathname, newOrders, onNavigate }: { pathname: string; newOrders: number; onNavigate?: () => void }) {
  const { a } = useAdminI18n();
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, key, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        const badge = key === "orders" && newOrders > 0 ? newOrders : 0;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                active ? "bg-accent text-on-accent" : "text-ink-soft hover:bg-sand hover:text-ink",
              )}
            >
              <Icon className={cn("size-[1.125rem]", active ? "" : "text-muted group-hover:text-ink")} aria-hidden strokeWidth={1.9} />
              <span className="flex-1">{a.shell.nav[key]}</span>
              {badge > 0 && (
                <span
                  className={cn("min-w-5 rounded-md px-1.5 text-center text-xs leading-5 tabular-nums", active ? "bg-black/15" : "bg-accent text-on-accent")}
                  aria-label={a.ui.notifications.replace("{count}", String(badge))}
                >
                  {badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminNav({ newOrders = 0, onNavigate }: { newOrders?: number; onNavigate?: () => void }) {
  return <WithPathname>{(pathname) => <AdminNavView pathname={pathname} newOrders={newOrders} onNavigate={onNavigate} />}</WithPathname>;
}
