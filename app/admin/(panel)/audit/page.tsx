import Link from "next/link";
import { AdminPageHeader, EmptyState, Panel, SegmentTabs } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { listAudit } from "@/services/audit";

export const generateMetadata = () => adminTitle("audit");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

const ENTITIES = [
  { key: "", label: "all" },
  { key: "product", label: "product" },
  { key: "category", label: "category" },
  { key: "order", label: "order" },
  { key: "user", label: "user" },
  { key: "market", label: "market" },
] as const;

const LINK: Record<string, (id: string) => string> = {
  product: (id) => `/admin/products/${id}`,
  category: (id) => `/admin/categories/${id}`,
  order: (id) => `/admin/orders/${id}`,
  user: (id) => `/admin/users/${id}`,
};

/** Who changed what and when. Entries hold summaries only — never passwords, tokens or secrets. */
export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const params = await searchParams;
  const entity: string = ENTITIES.some((e) => e.key === params.entity) ? (params.entity as string) : "";
  const entries = await listAudit({ entity, take: 200 });

  return (
    <>
      <AdminPageHeader title={a.meta.audit} description={a.audit.lead} />
      <SegmentTabs
        label={a.audit.filter}
        className="mb-5"
        items={ENTITIES.map((e) => ({ href: e.key ? `/admin/audit?entity=${e.key}` : "/admin/audit", label: a.audit[e.label], active: entity === e.key }))}
      />
      <Panel>
        {entries.length === 0 ? (
          <EmptyState>{a.audit.empty}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((e) => {
              const href = e.entityId && LINK[e.entity]?.(e.entityId);
              return (
                <li key={e.id} className="grid gap-1 px-5 py-3 text-sm transition-colors hover:bg-sand/40 md:grid-cols-[10rem_minmax(0,1fr)_14rem] md:gap-4">
                  <span className="text-xs text-muted tabular-nums">{formatDateTime(e.createdAt, locale)}</span>
                  <span className="min-w-0">
                    {href ? (
                      <Link href={href} className="font-semibold break-words hover:text-accent-ink">{e.summary}</Link>
                    ) : (
                      <span className="font-semibold break-words">{e.summary}</span>
                    )}
                    <span className="mt-0.5 inline-block rounded bg-sand px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted">{e.action}</span>
                  </span>
                  <span className="truncate text-xs text-muted">{e.actorEmail}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
