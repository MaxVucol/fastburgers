import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/session";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { isObjectId } from "@/lib/utils";
import { getCategoryAdmin } from "@/services/admin-catalog";

export const generateMetadata = () => adminTitle("editCategory");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { a } = await getAdminI18n();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const category = await getCategoryAdmin(id);
  if (!category) notFound();

  return (
    <>
      <AdminPageHeader title={category.name} description={a.categories.editLead} />
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
