import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { listCategoryOptions } from "@/services/admin-catalog";

export const generateMetadata = () => adminTitle("newProduct");

export default async function NewProductPage() {
  await requireAdmin();
  const { a } = await getAdminI18n();
  const categories = await listCategoryOptions();
  return (
    <>
      <AdminPageHeader title={a.meta.newProduct} description={a.products.newLead} />
      {categories.length === 0 ? (
        <p className="rounded-xl bg-mustard-soft p-4 text-sm">{a.products.needCategory}</p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </>
  );
}
