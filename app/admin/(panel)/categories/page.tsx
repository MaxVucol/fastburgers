import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { CategoryActiveSwitch, DeleteButton, MoveButtons } from "@/components/admin/admin-controls";
import { AdminPageHeader, Panel, SavedNotice } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { listCategoriesAdmin } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Categorii" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const [{ saved }, categories] = await Promise.all([searchParams, listCategoriesAdmin()]);

  return (
    <>
      <AdminPageHeader
        title="Categorii"
        description="Ordinea de aici este ordinea din meniu și din homepage."
        action={{ href: "/admin/categories/new", label: "Categorie nouă", icon: <Plus className="size-4.5" aria-hidden /> }}
      />
      <SavedNotice show={saved === "1"}>Categoria a fost salvată.</SavedNotice>
      <Panel>
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nu există categorii.</p>
        ) : (
          <ol className="divide-y divide-line">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                <MoveButtons id={c.id} name={c.name} isFirst={i === 0} isLast={i === categories.length - 1} />
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {c.image && <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/categories/${c.id}`} className="block truncate font-semibold hover:text-accent">
                    {c.name}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    /{c.slug} · {c._count.products} produse
                  </span>
                </span>
                <CategoryActiveSwitch id={c.id} value={c.active} label={`${c.name} activă`} />
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink"
                  aria-label={`Editează ${c.name}`}
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
