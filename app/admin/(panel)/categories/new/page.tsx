import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/session";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";

export const generateMetadata = () => adminTitle("newCategory");

export default async function NewCategoryPage() {
  await requireAdmin();
  const { a } = await getAdminI18n();
  return (
    <>
      <AdminPageHeader title={a.meta.newCategory} />
      <CategoryForm />
    </>
  );
}
