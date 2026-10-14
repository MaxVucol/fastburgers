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

function AdminNavView({ pathname }: { pathname: string }) {
  const { a } = useAdminI18n();
  return (
    <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, key, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-ink text-on-ink" : "text-ink-soft hover:bg-sand",
              )}
            >
              <Icon className="size-4.5" aria-hidden />
              {a.shell.nav[key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminNav() {
  return <WithPathname>{(pathname) => <AdminNavView pathname={pathname} />}</WithPathname>;
}
