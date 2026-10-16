"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/actions/auth";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Closes a popup on Escape and on a click outside `ref`. */
export function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close, ref]);
}

/** Navigation drawer for phones and tablets (the sidebar is shown from `lg` up). */
export function AdminMobileNav({ newOrders }: { newOrders: number }) {
  const { a } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="admin-drawer"
        className="grid size-10 place-items-center rounded-lg border border-line bg-paper text-ink-soft hover:text-ink lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
        <span className="sr-only">{a.ui.openMenu}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label={a.ui.closeMenu} onClick={close} tabIndex={-1} />
          <div
            id="admin-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={a.shell.navLabel}
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-line bg-ivory"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <Logo href="/admin" onClick={close} />
              <button type="button" onClick={close} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink">
                <X className="size-5" aria-hidden />
                <span className="sr-only">{a.ui.closeMenu}</span>
              </button>
            </div>
            <nav aria-label={a.shell.navLabel} className="flex-1 overflow-y-auto px-3">
              <AdminNav newOrders={newOrders} onNavigate={close} />
            </nav>
            <div className="space-y-1 border-t border-line p-3">
              <Link href="/" target="_blank" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-sand hover:text-ink">
                <ExternalLink className="size-[1.125rem] text-muted" aria-hidden /> {a.shell.viewSite}
              </Link>
              <form action={logout}>
                <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-sand hover:text-ink">
                  <LogOut className="size-[1.125rem] text-muted" aria-hidden /> {a.shell.logout}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Name, role and the account actions (open the site, sign out). */
export function AdminProfileMenu({ name, email }: { name: string; email: string }) {
  const { a } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 text-left hover:bg-sand"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-ink-soft ring-1 ring-line">{initials || "A"}</span>
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-40 truncate text-sm leading-tight font-semibold">{name}</span>
          <span className="block text-xs leading-tight text-muted">{a.ui.role}</span>
        </span>
        <ChevronDown className={cn("hidden size-4 text-muted transition-transform md:block", open && "rotate-180")} aria-hidden />
        <span className="sr-only">{a.ui.profileMenu}</span>
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-lift)]">
          <p className="border-b border-line px-4 py-3 text-xs text-muted">
            <span className="block truncate text-sm font-semibold text-ink">{name}</span>
            <span className="block truncate">{fill(a.ui.signedInAs, { email })}</span>
          </p>
          <div className="p-1.5">
            <Link
              role="menuitem"
              href="/"
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-ink-soft hover:bg-sand hover:text-ink"
            >
              <ExternalLink className="size-4 text-muted" aria-hidden /> {a.shell.viewSite}
            </Link>
            <form action={logout}>
              <button role="menuitem" type="submit" className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-ink-soft hover:bg-sand hover:text-ink">
                <LogOut className="size-4 text-muted" aria-hidden /> {a.shell.logout}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
