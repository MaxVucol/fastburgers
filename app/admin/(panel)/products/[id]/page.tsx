import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { isObjectId } from "@/lib/utils";
import { getProductAdmin, listCategoryOptions } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Editează produs" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [product, categories] = await Promise.all([getProductAdmin(id), listCategoryOptions()]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader title={product.name} description="Editează produsul.">
        <Link href={`/menu/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          Vezi în site <ExternalLink className="size-4" aria-hidden />
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
