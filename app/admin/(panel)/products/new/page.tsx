import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { listCategoryOptions } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Produs nou" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listCategoryOptions();
  return (
    <>
      <AdminPageHeader title="Produs nou" description="Completează detaliile — produsul apare imediat în meniu dacă este activ." />
      {categories.length === 0 ? (
        <p className="rounded-xl bg-mustard-soft p-4 text-sm">Creează mai întâi o categorie.</p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </>
  );
}
