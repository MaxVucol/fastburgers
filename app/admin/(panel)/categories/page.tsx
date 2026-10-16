import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { CategoryActiveSwitch, DeleteButton, MoveButtons } from "@/components/admin/admin-controls";
import { AdminPageHeader, EmptyState, Panel, SavedNotice, adminIconButton } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { listCategoriesAdmin } from "@/services/admin-catalog";

export const generateMetadata = () => adminTitle("categories");

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const { a } = await getAdminI18n();
  const t = a.categories;
  const [{ saved }, categories] = await Promise.all([searchParams, listCategoriesAdmin()]);

  return (
    <>
      <AdminPageHeader
        title={a.meta.categories}
        description={t.lead}
        action={{ href: "/admin/categories/new", label: t.new, icon: <Plus className="size-4.5" aria-hidden /> }}
      />
      <SavedNotice show={saved === "1"}>{t.saved}</SavedNotice>
      <Panel>
        {categories.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <ol className="divide-y divide-line">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sand/40 sm:gap-4 sm:px-5">
                <MoveButtons id={c.id} name={c.name} isFirst={i === 0} isLast={i === categories.length - 1} />
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {c.image && <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/categories/${c.id}`} className="block truncate font-semibold hover:text-accent-ink">
                    {c.name}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    /{c.slug} · {fill(t.products, { count: c._count.products })}
                  </span>
                </span>
                <CategoryActiveSwitch id={c.id} value={c.active} label={fill(t.switchActive, { name: c.name })} />
                <Link
                  href={`/admin/categories/${c.id}`}
                  className={adminIconButton}
                  aria-label={fill(a.common.edit, { name: c.name })}
                >
                  <Pencil className="size-4" aria-hidden />
                </Link>
                <DeleteButton id={c.id} kind="category" name={c.name} />
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
