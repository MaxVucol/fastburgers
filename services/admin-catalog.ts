import "server-only";
import { prisma } from "@/lib/prisma";

// Admin reads are intentionally uncached: staff must always see the current state.

export async function listCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      order: true,
      active: true,
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryAdmin(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function listProductsAdmin(filters: { q?: string; categoryId?: string }) {
  return prisma.product.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { slug: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      price: true,
      oldPrice: true,
      active: true,
      popular: true,
      isNew: true,
      featured: true,
      category: { select: { name: true } },
      _count: { select: { options: true } },
    },
  });
}

export async function getProductAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { options: { orderBy: { createdAt: "asc" } } },
  });
}

export async function listCategoryOptions() {
  return prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
}
