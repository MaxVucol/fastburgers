import Link from "next/link";
import { Search } from "lucide-react";
import type { Role } from "@prisma/client";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { listUsersAdmin } from "@/services/admin-users";

export const generateMetadata = () => adminTitle("users");

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
      <form role="search" className="mb-5 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-10 focus:border-accent focus:outline-none" />
        </label>
        <label>
          <span className="sr-only">{t.role}</span>
          <select name="role" defaultValue={role ?? ""} className="h-11 w-full rounded-xl border border-line bg-paper px-3 sm:w-44">
            <option value="">{t.allRoles}</option>
            <option value="CUSTOMER">{t.customers}</option>
            <option value="ADMIN">{t.admins}</option>
          </select>
        </label>
        <button type="submit" className={buttonStyles({ variant: "dark" })}>{a.common.filter}</button>
      </form>

      <Panel>
        {users.length === 0 ? (
          <p className="p-6 text-sm text-muted">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-cream md:grid-cols-[minmax(0,1fr)_8rem_7rem_6rem]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "ADMIN" ? "bg-ink text-on-ink" : "bg-sand text-ink-soft"}`}>
                      {u.role === "ADMIN" ? t.admin : t.customer}
                    </span>
                    {u.blockedAt && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink">{t.blocked}</span>}
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
