import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { UserControls } from "@/components/admin/user-controls";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { isObjectId } from "@/lib/utils";
import { getUserAdmin } from "@/services/admin-users";
import { listAudit } from "@/services/audit";

export const generateMetadata = () => adminTitle("user");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.user;
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [user, history] = await Promise.all([getUserAdmin(id), listAudit({ entity: "user", entityId: id, take: 20 })]);
  if (!user) notFound();

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t.back}
      </Link>
      <AdminPageHeader title={user.name} description={user.email} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={fill(t.orders, { count: user.orders.length })}>
          {user.orders.length === 0 ? (
            <p className="p-5 text-sm text-muted">{t.noOrders}</p>
          ) : (
            <ul className="divide-y divide-line">
              {user.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-sand/40">
                    <span className="font-mono text-sm font-semibold">{o.number}</span>
                    <span className="flex-1 text-xs text-muted">{formatDateTime(o.createdAt, locale)}</span>
                    <StatusBadge status={o.status} label={a.status[o.status]} />
                    <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(o.total, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title={t.profile}>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 p-5 text-sm">
              <dt className="text-muted">{t.role}</dt>
              <dd className="font-semibold">{user.role === "ADMIN" ? t.administrator : t.customer}</dd>
              <dt className="text-muted">{t.state}</dt>
              <dd className="font-semibold">{user.blockedAt ? fill(t.blockedSince, { date: formatDate(user.blockedAt, locale) }) : t.active}</dd>
              <dt className="text-muted">{t.phone}</dt>
              <dd>{user.phone ?? "—"}</dd>
              <dt className="text-muted">{t.emailVerified}</dt>
              <dd>{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt, locale) : t.no}</dd>
              <dt className="text-muted">{t.created}</dt>
              <dd>{formatDate(user.createdAt, locale)}</dd>
              <dt className="text-muted">{t.addressesFavorites}</dt>
              <dd>
                {user._count.addresses} / {user._count.favorites}
              </dd>
            </dl>
          </Panel>
          <Panel title={t.access}>
            <div className="p-5">
              <UserControls id={user.id} email={user.email} role={user.role} blocked={Boolean(user.blockedAt)} self={user.id === admin.id} />
            </div>
          </Panel>
          {history.length > 0 && (
            <Panel title={t.accessHistory}>
              <ul className="space-y-2 p-5 text-sm">
                {history.map((e) => (
                  <li key={e.id}>
                    <span className="block font-semibold">{e.summary}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(e.createdAt, locale)} · {e.actorEmail}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
