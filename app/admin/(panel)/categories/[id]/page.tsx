import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/session";
import { isObjectId } from "@/lib/utils";
import { getCategoryAdmin } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Editează categoria" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const category = await getCategoryAdmin(id);
  if (!category) notFound();

  return (
    <>
      <AdminPageHeader title={category.name} description="Editează categoria." />
      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          active: category.active,
        }}
      />
    </>
  );
}
