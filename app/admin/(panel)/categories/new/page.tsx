import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Categorie nouă" };

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <>
      <AdminPageHeader title="Categorie nouă" />
      <CategoryForm />
    </>
  );
}
