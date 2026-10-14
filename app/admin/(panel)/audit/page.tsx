import Link from "next/link";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { cn } from "@/lib/utils";
import { listAudit } from "@/services/audit";

export const generateMetadata = () => adminTitle("audit");

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
      <nav aria-label={a.audit.filter} className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {ENTITIES.map((e) => (
          <Link
            key={e.key || "all"}
            href={e.key ? `/admin/audit?entity=${e.key}` : "/admin/audit"}
            aria-current={entity === e.key ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold",
              entity === e.key ? "bg-ink text-on-ink" : "bg-paper text-ink-soft ring-1 ring-line hover:bg-sand",
            )}
          >
            {a.audit[e.label]}
          </Link>
        ))}
      </nav>
      <Panel>
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-muted">{a.audit.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((e) => {
              const href = e.entityId && LINK[e.entity]?.(e.entityId);
              return (
                <li key={e.id} className="grid gap-1 px-5 py-3 text-sm md:grid-cols-[10rem_minmax(0,1fr)_14rem] md:gap-4">
                  <span className="text-xs text-muted tabular-nums">{formatDateTime(e.createdAt, locale)}</span>
                  <span className="min-w-0">
                    {href ? (
                      <Link href={href} className="font-semibold break-words hover:text-accent-ink">{e.summary}</Link>
                    ) : (
                      <span className="font-semibold break-words">{e.summary}</span>
                    )}
                    <span className="block text-xs text-muted">{e.action}</span>
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
