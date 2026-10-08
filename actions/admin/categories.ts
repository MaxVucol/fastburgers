"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteImage, isUploadedFile, saveImage, UploadError } from "@/lib/storage";
import { isObjectId } from "@/lib/utils";
import { categoryInputSchema } from "@/lib/validation/admin";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { CATALOG_TAGS } from "@/services/catalog";

export type CategoryFormState = { error?: string; fieldErrors?: FieldErrors };

function invalidate() {
  updateTag(CATALOG_TAGS.categories);
  updateTag(CATALOG_TAGS.products);
}


export async function saveCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: "Categorie invalidă." };
  const existing = id ? await prisma.category.findUnique({ where: { id }, select: { id: true, image: true } }) : null;
  if (id && !existing) return { error: "Categoria nu mai există." };

  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: formData.get("description") ?? "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: "Verifică câmpurile marcate.", fieldErrors: toFieldErrors(parsed.error) };

  const slugTaken = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, NOT: id ? { id } : undefined },
    select: { id: true },
  });
  if (slugTaken) return { error: "Slug-ul este deja folosit.", fieldErrors: { slug: "Alege alt slug" } };

  let image = existing?.image ?? null;
  const file = formData.get("imageFile");
  if (isUploadedFile(file)) {
    try {
      image = await saveImage(file);
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message, fieldErrors: { image: error.message } };
      throw error;
    }
  }

  if (existing) {
    await prisma.category.update({ where: { id: existing.id }, data: { ...parsed.data, image } });
    if (existing.image && existing.image !== image) await deleteImage(existing.image);
  } else {
    const last = await prisma.category.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    await prisma.category.create({ data: { ...parsed.data, image, order: (last?.order ?? -1) + 1 } });
  }
  invalidate();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!isObjectId(id)) return { error: "Categorie invalidă." };
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return { error: `Categoria are ${productCount} produse. Mută-le sau șterge-le întâi.` };
  }
  const category = await prisma.category.delete({ where: { id }, select: { image: true } });
  if (category.image) await deleteImage(category.image);
  invalidate();
  refresh();
  return {};
}

export async function setCategoryActive(id: string, active: boolean) {
  await requireAdmin();
  if (!isObjectId(id) || typeof active !== "boolean") return;
  await prisma.category.update({ where: { id }, data: { active } });
  invalidate();
}

/** Moves a category one position up or down by swapping `order` with its neighbour. */
export async function moveCategory(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (!isObjectId(id) || (direction !== "up" && direction !== "down")) return;

  const all = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true } });
  const index = all.findIndex((c) => c.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= all.length) return;

  [all[index], all[target]] = [all[target], all[index]];
  // Normalise to 0..n so gaps from deletions disappear.
  await prisma.$transaction(all.map((c, order) => prisma.category.update({ where: { id: c.id }, data: { order } })));
  invalidate();
  refresh();
}
