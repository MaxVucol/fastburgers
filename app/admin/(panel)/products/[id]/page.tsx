import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { isObjectId } from "@/lib/utils";
import { getProductAdmin, listCategoryOptions } from "@/services/admin-catalog";

export const generateMetadata = () => adminTitle("editProduct");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { a } = await getAdminI18n();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [product, categories] = await Promise.all([getProductAdmin(id), listCategoryOptions()]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader title={product.name} description={a.products.editLead}>
        <Link href={`/menu/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          {a.products.viewOnSite} <ExternalLink className="size-4" aria-hidden />
        </Link>
      </AdminPageHeader>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          oldPrice: product.oldPrice,
          categoryId: product.categoryId,
          ingredients: product.ingredients,
          allergens: product.allergens,
          weight: product.weight,
          weightUnit: product.weightUnit,
          calories: product.calories,
          popular: product.popular,
          featured: product.featured,
          isNew: product.isNew,
          spicy: product.spicy ?? false,
          soldOut: product.soldOut ?? false,
          draft: product.draft ?? false,
          active: product.active,
          image: product.image,
          images: product.images,
          options: product.options.map((o) => ({ id: o.id, name: o.name, price: o.price, active: o.active })),
        }}
      />
    </>
  );
}
