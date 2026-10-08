"use client";

import Link from "next/link";
import { ClipboardList, FolderTree, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import { WithPathname } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Comenzi", icon: ClipboardList },
  { href: "/admin/products", label: "Produse", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categorii", icon: FolderTree },
];

function AdminNavView({ pathname }: { pathname: string }) {
  return (
    <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-ink text-white" : "text-ink-soft hover:bg-sand",
              )}
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
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
