import Link from "next/link";
import { Search } from "lucide-react";
import type { Role } from "@prisma/client";
import { AdminPageHeader, EmptyState, Panel, adminControl, adminButton } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { listUsersAdmin } from "@/services/admin-users";

export const generateMetadata = () => adminTitle("users");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.users;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const role = params.role === "ADMIN" || params.role === "CUSTOMER" ? (params.role as Role) : undefined;
  const users = await listUsersAdmin({ q, role });

  return (
    <>
      <AdminPageHeader title={a.meta.users} description={fill(q || role ? t.found : t.count, { count: users.length })} />
      <form role="search" className="mb-5 flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder={t.searchPlaceholder} className={`${adminControl} w-full pl-9`} />
        </label>
        <label>
          <span className="sr-only">{t.role}</span>
          <select name="role" defaultValue={role ?? ""} className={`${adminControl} w-full sm:w-44`}>
            <option value="">{t.allRoles}</option>
            <option value="CUSTOMER">{t.customers}</option>
            <option value="ADMIN">{t.admins}</option>
          </select>
        </label>
        <button type="submit" className={adminButton.dark}>{a.common.filter}</button>
      </form>

      <Panel>
        {users.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-sand/40 md:grid-cols-[minmax(0,1fr)_8rem_7rem_6rem]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${u.role === "ADMIN" ? "bg-accent-soft text-accent-ink ring-accent/25" : "bg-sand text-ink-soft ring-line"}`}>
                      {u.role === "ADMIN" ? t.admin : t.customer}
                    </span>
                    {u.blockedAt && <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line ring-inset">{t.blocked}</span>}
                  </span>
                  <span className="text-xs text-muted">{fill(t.orders, { count: u._count.orders })}</span>
                  <span className="text-right text-xs text-muted">{formatDate(u.createdAt, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
