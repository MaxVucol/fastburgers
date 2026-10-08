import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CategorySummary,
  PickupLocation,
  ProductCardData,
  ProductDetail,
  Review,
} from "@/types/catalog";

// Public catalog reads. Everything here is cached and tagged; admin mutations
// call updateTag() with the same CATALOG_TAGS.

export const CATALOG_TAGS = {
  categories: "categories",
  products: "products",
  product: (slug: string) => `product:${slug}`,
  reviews: "reviews",
  locations: "locations",
} as const;

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  price: true,
  oldPrice: true,
  image: true,
  popular: true,
  featured: true,
  isNew: true,
  weight: true,
  weightUnit: true,
  categoryId: true,
  createdAt: true,
  category: { select: { name: true, slug: true, order: true } },
  _count: { select: { options: { where: { active: true } } } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProductCardData {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    price: row.price,
    oldPrice: row.oldPrice,
    image: row.image,
    popular: row.popular,
    featured: row.featured,
    isNew: row.isNew,
    weight: row.weight,
    weightUnit: row.weightUnit,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    optionCount: row._count.options,
    createdAt: row.createdAt,
  };
}

const visibleProduct = {
  active: true,
  category: { is: { active: true } },
} satisfies Prisma.ProductWhereInput;

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAGS.categories);

  return prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true, description: true, image: true },
  });
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** All visible products, ordered like the printed menu (category order, then product order). */
export async function getMenuProducts(): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAGS.products, CATALOG_TAGS.categories);

  const rows = await prisma.product.findMany({
    where: visibleProduct,
    select: cardSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows
    .sort((a, b) => a.category.order - b.category.order)
    .map(toCard);
}

export async function getPopularProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await getMenuProducts();
  return products.filter((p) => p.popular).slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await getMenuProducts();
  return products.filter((p) => p.featured).slice(0, limit);
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductCardData[]> {
  const products = await getMenuProducts();
  return products.filter((p) => p.categorySlug === categorySlug);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAGS.products, CATALOG_TAGS.product(slug));

  const row = await prisma.product.findFirst({
    where: { slug, ...visibleProduct },
    select: {
      ...cardSelect,
      images: true,
      ingredients: true,
      allergens: true,
      calories: true,
      options: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, price: true },
      },
    },
  });
  if (!row) return null;

  return {
    ...toCard(row),
    images: row.images,
    ingredients: row.ingredients,
    allergens: row.allergens,
    calories: row.calories,
    options: row.options,
  };
}

export async function getRelatedProducts(product: ProductCardData, limit = 4) {
  const products = await getMenuProducts();
  const sameCategory = products.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id,
  );
  const others = products.filter((p) => p.categoryId !== product.categoryId && p.popular);
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getReviews(limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAGS.reviews);

  return prisma.review.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, avatar: true, rating: true, text: true, createdAt: true },
  });
}

export async function getPickupLocations(): Promise<PickupLocation[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAGS.locations);

  return prisma.location.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, address: true, phone: true, hours: true },
  });
}
