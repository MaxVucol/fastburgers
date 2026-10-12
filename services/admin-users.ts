import "server-only";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Admin reads of accounts. Never select password hashes, tokens or session versions.

export async function listUsersAdmin(filters: { q?: string; role?: Role; take?: number }) {
  const q = filters.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/[\s().-]/g, "") } },
          ],
        }
      : {}),
  };
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 100,
    select: { id: true, name: true, email: true, phone: true, role: true, blockedAt: true, emailVerifiedAt: true, createdAt: true, _count: { select: { orders: true } } },
  });
}

export async function getUserAdmin(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blockedAt: true,
      emailVerifiedAt: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, number: true, status: true, total: true, createdAt: true },
      },
      _count: { select: { addresses: true, favorites: true } },
    },
  });
}
