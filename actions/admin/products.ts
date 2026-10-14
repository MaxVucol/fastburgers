"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice, parsePriceToBani } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { translateAdminMessage, translateFieldErrors } from "@/lib/i18n/admin";
import { getAdminI18n } from "@/lib/i18n/admin/server";
import { prisma } from "@/lib/prisma";
import { deleteImage, isUploadedFile, saveImage, UploadError } from "@/lib/storage";
import { isObjectId } from "@/lib/utils";
import { productInputSchema } from "@/lib/validation/admin";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { audit } from "@/services/audit";
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
  const admin = await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.productActions;

  const id = String(formData.get("id") ?? "");
  if (id && !isObjectId(id)) return { error: t.invalid };
  const existing = id
    ? await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, image: true, images: true, price: true, active: true, soldOut: true } })
    : null;
  if (id && !existing) return { error: t.gone };

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
    // A draft (recipe not approved) is never published.
    active: formData.get("active") === "on" && formData.get("draft") !== "on",
    options: parseOptions(formData.get("options")),
  });
  if (!parsed.success) {
    return { error: a.common.checkFields, fieldErrors: translateFieldErrors(a, toFieldErrors(parsed.error)) };
  }
  const data = parsed.data;
  const draft = formData.get("draft") === "on";
  const spicy = formData.get("spicy") === "on";
  const soldOut = formData.get("soldOut") === "on";

  // A price change on an existing dish must be confirmed for exactly the new value.
  if (existing && data.price !== existing.price && formData.get("confirmPrice") !== String(data.price)) {
    return {
      error: fill(t.confirmPrice, { from: formatPrice(existing.price, locale), to: formatPrice(data.price, locale) }),
      fieldErrors: { price: t.confirmPriceField },
    };
  }

  const [slugTaken, category] = await Promise.all([
    prisma.product.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
  ]);
  if (slugTaken) return { error: t.slugTaken, fieldErrors: { slug: t.slugField } };
  if (!category) return { error: t.noCategory, fieldErrors: { categoryId: t.categoryField } };

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
    if (error instanceof UploadError) {
      const message = translateAdminMessage(a, error.message);
      return { error: message, fieldErrors: { image: message } };
    }
    throw error;
  }
  if (!image) return { error: t.needImage, fieldErrors: { image: t.imageField } };

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
    spicy,
    soldOut,
    draft,
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
    const changes = [
      data.price !== existing.price && `preț ${formatPrice(existing.price)} → ${formatPrice(data.price)}`,
      data.active !== existing.active && (data.active ? "publicat" : "ascuns"),
      soldOut !== Boolean(existing.soldOut) && (soldOut ? "indisponibil temporar" : "din nou disponibil"),
    ].filter(Boolean);
    await audit(admin, data.price !== existing.price ? "product.price" : "product.update", "product", existing.id, `${data.name}${changes.length ? `: ${changes.join(", ")}` : ""}`);
  } else {
    const count = await prisma.product.count();
    const created = await prisma.product.create({
      data: {
        ...productData,
        sortOrder: count,
        options: { create: data.options.map((o) => ({ name: o.name, price: o.price, active: o.active })) },
      },
      select: { id: true },
    });
    invalidateCatalog(data.slug);
    await audit(admin, "product.create", "product", created.id, `${data.name} · ${formatPrice(data.price)}${draft ? " · ciornă" : ""}`);
  }

  redirect("/admin/products?saved=1");
}

/**
 * Deletes a dish that was never ordered. Ordered dishes stay (hide them instead): order lines keep
 * their own snapshot, but the dish's history and statistics would lose their reference.
 */
export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  if (!isObjectId(id)) return { error: a.productActions.invalid };
  const product = await prisma.product.findUnique({ where: { id }, select: { slug: true, name: true, image: true, images: true } });
  if (!product) return {};
  if ((await prisma.orderItem.count({ where: { productId: id } })) > 0) {
    return { error: fill(a.productActions.inOrders, { name: product.name }) };
  }
  await prisma.$transaction([
    prisma.productOption.deleteMany({ where: { productId: id } }),
    prisma.favorite.deleteMany({ where: { productId: id } }),
    prisma.competitorPrice.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.product.delete({ where: { id } }),
  ]);
  await Promise.all([product.image, ...product.images].filter(Boolean).map(deleteImage));
  invalidateCatalog(product.slug);
  await audit(admin, "product.delete", "product", id, product.name);
  refresh();
  return {};
}

const FLAGS = ["active", "popular", "isNew", "featured", "spicy", "soldOut"] as const;
type ProductFlag = (typeof FLAGS)[number];
const FLAG_LABEL: Record<ProductFlag, string> = {
  active: "vizibil",
  popular: "popular",
  isNew: "nou",
  featured: "recomandat",
  spicy: "picant",
  soldOut: "indisponibil temporar",
};

export async function setProductFlag(id: string, flag: ProductFlag, value: boolean): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  if (!isObjectId(id) || !FLAGS.includes(flag) || typeof value !== "boolean") return { error: a.common.invalidRequest };
  if (flag === "active" && value) {
    const current = await prisma.product.findUnique({ where: { id }, select: { draft: true, image: true } });
    if (current?.draft) return { error: a.productActions.draftPublish };
    if (!current?.image) return { error: a.productActions.photoPublish };
  }
  const product = await prisma.product.update({ where: { id }, data: { [flag]: value }, select: { slug: true, name: true } });
  invalidateCatalog(product.slug);
  await audit(admin, "product.flag", "product", id, `${product.name}: ${FLAG_LABEL[flag]} ${value ? "da" : "nu"}`);
  return {};
}
