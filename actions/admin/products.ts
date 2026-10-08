"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { parsePriceToBani } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { deleteImage, isUploadedFile, saveImage, UploadError } from "@/lib/storage";
import { isObjectId } from "@/lib/utils";
import { productInputSchema } from "@/lib/validation/admin";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { CATALOG_TAGS } from "@/services/catalog";

export type ProductFormState = { error?: string; fieldErrors?: FieldErrors };

function invalidateCatalog(...slugs: string[]) {
  updateTag(CATALOG_TAGS.products);
  for (const slug of new Set(slugs)) updateTag(CATALOG_TAGS.product(slug));
}

function optionalInt(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : Number.NaN;
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type RawOption = { id?: unknown; name?: unknown; price?: unknown; active?: unknown };

function parseOptions(raw: FormDataEntryValue | null) {
  try {
    const parsed: unknown = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((o: RawOption) => ({
      id: typeof o.id === "string" && isObjectId(o.id) ? o.id : undefined,
      name: typeof o.name === "string" ? o.name : "",
      price: typeof o.price === "string" ? parsePriceToBani(o.price) : Number.NaN,
      active: o.active !== false,
    }));
  } catch {
    return [];
  }
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: "Produs invalid." };
  const existing = id
    ? await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, image: true, images: true } })
    : null;
  if (id && !existing) return { error: "Produsul nu mai există." };

  const oldPriceRaw = String(formData.get("oldPrice") ?? "").trim();
  const parsed = productInputSchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: parsePriceToBani(String(formData.get("price") ?? "")),
    oldPrice: oldPriceRaw ? parsePriceToBani(oldPriceRaw) : null,
    categoryId: formData.get("categoryId"),
    ingredients: list(formData.get("ingredients")),
    allergens: formData.getAll("allergens").map(String),
    weight: optionalInt(formData.get("weight")),
    weightUnit: formData.get("weightUnit"),
    calories: optionalInt(formData.get("calories")),
    popular: formData.get("popular") === "on",
    featured: formData.get("featured") === "on",
    isNew: formData.get("isNew") === "on",
    active: formData.get("active") === "on",
    options: parseOptions(formData.get("options")),
  });
  if (!parsed.success) {
    return { error: "Verifică câmpurile marcate.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const [slugTaken, category] = await Promise.all([
    prisma.product.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
  ]);
  if (slugTaken) return { error: "Slug-ul este deja folosit.", fieldErrors: { slug: "Alege alt slug" } };
  if (!category) return { error: "Categoria nu există.", fieldErrors: { categoryId: "Categorie invalidă" } };

  // Images: keep the ones still checked, add new uploads.
  const mainFile = formData.get("imageFile");
  const galleryFiles = formData.getAll("galleryFiles").filter(isUploadedFile);
  const keepGallery = formData
    .getAll("keepImages")
    .map(String)
    .filter((src) => existing?.images.includes(src));

  let image = existing?.image ?? "";
  const uploaded: string[] = [];
  try {
    if (isUploadedFile(mainFile)) {
      image = await saveImage(mainFile);
      uploaded.push(image);
    }
    for (const file of galleryFiles.slice(0, 8)) uploaded.push(await saveImage(file));
  } catch (error) {
    await Promise.all(uploaded.map(deleteImage));
    if (error instanceof UploadError) return { error: error.message, fieldErrors: { image: error.message } };
    throw error;
  }
  if (!image) return { error: "Adaugă o imagine principală.", fieldErrors: { image: "Imaginea este obligatorie" } };

  const newGallery = uploaded.filter((u) => u !== image);
  const images = [image, ...keepGallery.filter((src) => src !== image), ...newGallery];

  const productData = {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    description: data.description,
    price: data.price,
    oldPrice: data.oldPrice,
    categoryId: data.categoryId,
    ingredients: data.ingredients,
    allergens: data.allergens,
    weight: data.weight,
    weightUnit: data.weightUnit,
    calories: data.calories,
    popular: data.popular,
    featured: data.featured,
    isNew: data.isNew,
    active: data.active,
    image,
    images,
  };

  if (existing) {
    const keptOptionIds = data.options.flatMap((o) => (o.id ? [o.id] : []));
    await prisma.$transaction([
      prisma.product.update({ where: { id: existing.id }, data: productData }),
      prisma.productOption.deleteMany({ where: { productId: existing.id, id: { notIn: keptOptionIds } } }),
      ...data.options.map((o) =>
        o.id
          ? prisma.productOption.updateMany({
              where: { id: o.id, productId: existing.id },
              data: { name: o.name, price: o.price, active: o.active },
            })
          : prisma.productOption.create({
              data: { productId: existing.id, name: o.name, price: o.price, active: o.active },
            }),
      ),
    ]);
    // Remove uploaded files that are no longer referenced.
    const removed = [existing.image, ...existing.images].filter((src) => !images.includes(src));
    await Promise.all(removed.map(deleteImage));
    invalidateCatalog(existing.slug, data.slug);
  } else {
    const count = await prisma.product.count();
    await prisma.product.create({
      data: {
        ...productData,
        sortOrder: count,
        options: { create: data.options.map((o) => ({ name: o.name, price: o.price, active: o.active })) },
      },
    });
    invalidateCatalog(data.slug);
  }

  redirect("/admin/products?saved=1");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  if (!isObjectId(id)) return;
  const product = await prisma.product.findUnique({ where: { id }, select: { slug: true, image: true, images: true } });
  if (!product) return;
  await prisma.$transaction([
    prisma.productOption.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
  await Promise.all([product.image, ...product.images].map(deleteImage));
  invalidateCatalog(product.slug);
  refresh();
}

const FLAGS = ["active", "popular", "isNew", "featured"] as const;
type ProductFlag = (typeof FLAGS)[number];

export async function setProductFlag(id: string, flag: ProductFlag, value: boolean) {
  await requireAdmin();
  if (!isObjectId(id) || !FLAGS.includes(flag) || typeof value !== "boolean") return;
  const product = await prisma.product.update({ where: { id }, data: { [flag]: value }, select: { slug: true } });
  invalidateCatalog(product.slug);
}
