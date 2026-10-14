"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/services/audit";
import { fill } from "@/lib/i18n/config";
import { translateAdminMessage, translateFieldErrors } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";
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
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  const t = a.categoryActions;

  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: t.invalid };
  const existing = id ? await prisma.category.findUnique({ where: { id }, select: { id: true, image: true } }) : null;
  if (id && !existing) return { error: t.gone };

  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: formData.get("description") ?? "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: a.common.checkFields, fieldErrors: translateFieldErrors(a, toFieldErrors(parsed.error)) };

  const slugTaken = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, NOT: id ? { id } : undefined },
    select: { id: true },
  });
  if (slugTaken) return { error: a.productActions.slugTaken, fieldErrors: { slug: a.productActions.slugField } };

  let image = existing?.image ?? null;
  const file = formData.get("imageFile");
  if (isUploadedFile(file)) {
    try {
      image = await saveImage(file);
    } catch (error) {
      if (error instanceof UploadError) {
        const message = translateAdminMessage(a, error.message);
        return { error: message, fieldErrors: { image: message } };
      }
      throw error;
    }
  }

  if (existing) {
    await prisma.category.update({ where: { id: existing.id }, data: { ...parsed.data, image } });
    if (existing.image && existing.image !== image) await deleteImage(existing.image);
    await audit(admin, "category.update", "category", existing.id, `${parsed.data.name}${parsed.data.active ? "" : " (ascunsă)"}`);
  } else {
    const last = await prisma.category.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const created = await prisma.category.create({ data: { ...parsed.data, image, order: (last?.order ?? -1) + 1 }, select: { id: true } });
    await audit(admin, "category.create", "category", created.id, parsed.data.name);
  }
  invalidate();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  if (!isObjectId(id)) return { error: a.categoryActions.invalid };
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return { error: fill(a.categoryActions.hasProducts, { count: productCount }) };
  }
  const category = await prisma.category.delete({ where: { id }, select: { image: true, name: true } });
  await audit(admin, "category.delete", "category", id, category.name);
  if (category.image) await deleteImage(category.image);
  invalidate();
  refresh();
  return {};
}

export async function setCategoryActive(id: string, active: boolean) {
  const admin = await requireAdmin();
  if (!isObjectId(id) || typeof active !== "boolean") return;
  const category = await prisma.category.update({ where: { id }, data: { active }, select: { name: true } });
  await audit(admin, "category.visibility", "category", id, `${category.name}: ${active ? "vizibilă" : "ascunsă"}`);
  invalidate();
}

/** Moves a category one position up or down by swapping `order` with its neighbour. */
export async function moveCategory(id: string, direction: "up" | "down") {
  const admin = await requireAdmin();
  if (!isObjectId(id) || (direction !== "up" && direction !== "down")) return;

  const all = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true } });
  const index = all.findIndex((c) => c.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= all.length) return;

  [all[index], all[target]] = [all[target], all[index]];
  // Normalise to 0..n so gaps from deletions disappear.
  await prisma.$transaction(all.map((c, order) => prisma.category.update({ where: { id: c.id }, data: { order } })));
  await audit(admin, "category.order", "category", id, direction === "up" ? "mutată mai sus" : "mutată mai jos");
  invalidate();
  refresh();
}
