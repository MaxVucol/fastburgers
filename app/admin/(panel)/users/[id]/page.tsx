import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { UserControls } from "@/components/admin/user-controls";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { isObjectId } from "@/lib/utils";
import { getUserAdmin } from "@/services/admin-users";
import { listAudit } from "@/services/audit";

export const metadata: Metadata = { title: "Utilizator" };

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [user, history] = await Promise.all([getUserAdmin(id), listAudit({ entity: "user", entityId: id, take: 20 })]);
  if (!user) notFound();

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Utilizatori
      </Link>
      <AdminPageHeader title={user.name} description={user.email} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={`Comenzi (${user.orders.length})`}>
          {user.orders.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nicio comandă plasată din acest cont.</p>
          ) : (
            <ul className="divide-y divide-line">
              {user.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-cream">
                    <span className="font-mono text-sm font-semibold">{o.number}</span>
                    <span className="flex-1 text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Profil">
            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 p-5 text-sm">
              <dt className="text-muted">Rol</dt>
              <dd className="font-semibold">{user.role === "ADMIN" ? "Administrator" : "Client"}</dd>
              <dt className="text-muted">Stare</dt>
              <dd className="font-semibold">{user.blockedAt ? `Blocat din ${formatDate(user.blockedAt)}` : "Activ"}</dd>
              <dt className="text-muted">Telefon</dt>
              <dd>{user.phone ?? "—"}</dd>
              <dt className="text-muted">Email confirmat</dt>
              <dd>{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Nu"}</dd>
              <dt className="text-muted">Cont creat</dt>
              <dd>{formatDate(user.createdAt)}</dd>
              <dt className="text-muted">Adrese / favorite</dt>
              <dd>
                {user._count.addresses} / {user._count.favorites}
              </dd>
            </dl>
          </Panel>
          <Panel title="Acces">
            <div className="p-5">
              <UserControls id={user.id} email={user.email} role={user.role} blocked={Boolean(user.blockedAt)} self={user.id === admin.id} />
            </div>
          </Panel>
          {history.length > 0 && (
            <Panel title="Istoric acces">
              <ul className="space-y-2 p-5 text-sm">
                {history.map((e) => (
                  <li key={e.id}>
                    <span className="block font-semibold">{e.summary}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(e.createdAt)} · {e.actorEmail}
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
