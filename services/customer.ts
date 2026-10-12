import "server-only";
import { prisma } from "@/lib/prisma";
import { isObjectId } from "@/lib/utils";

// Everything a signed-in customer can read or change about their own account. Every query is
// scoped by the user id from the verified session, so changing an id or order number in a URL
// or request can never reach another customer's data.

export const MAX_ADDRESSES = 10;

export async function listUserOrders(userId: string, take = 50) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      createdAt: true,
      deliveryMethod: true,
      _count: { select: { items: true } },
    },
  });
}

/** One order of this user by number (null when it does not exist or belongs to someone else). */
export async function getUserOrder(userId: string, number: string) {
  if (!/^FB-[A-Z0-9]{6,10}$/.test(number)) return null;
  return prisma.order.findFirst({
    where: { number, userId },
    select: {
      id: true,
      number: true,
      status: true,
      createdAt: true,
      deliveryMethod: true,
      deliveryAddress: true,
      paymentMethod: true,
      notes: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      location: { select: { name: true, address: true } },
      // The snapshot taken when the order was placed: later catalog edits never change it.
      items: { select: { id: true, productName: true, productSlug: true, image: true, quantity: true, price: true, total: true, options: true } },
    },
  });
}

export async function updateProfile(userId: string, data: { name: string; phone: string | null }) {
  await prisma.user.update({ where: { id: userId }, data: { name: data.name, phone: data.phone } });
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, address: true } });
}

/** Adds an address; false when the user already has the maximum number. */
export async function addAddress(userId: string, data: { label: string; address: string }) {
  if ((await prisma.address.count({ where: { userId } })) >= MAX_ADDRESSES) return false;
  await prisma.address.create({ data: { userId, label: data.label, address: data.address } });
  return true;
}

/** Deletes only if the address belongs to the user. */
export async function deleteAddress(userId: string, id: string) {
  if (!isObjectId(id)) return false;
  const { count } = await prisma.address.deleteMany({ where: { id, userId } });
  return count === 1;
}

export async function listFavoriteIds(userId: string) {
  const rows = await prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function isFavorite(userId: string, productId: string) {
  if (!isObjectId(productId)) return false;
  return (await prisma.favorite.count({ where: { userId, productId } })) > 0;
}

/** Toggles a favourite for an existing product; returns the new state. */
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  if (!isObjectId(productId)) return false;
  const { count } = await prisma.favorite.deleteMany({ where: { userId, productId } });
  if (count > 0) return false;
  const exists = await prisma.product.count({ where: { id: productId } });
  if (!exists) return false;
  try {
    await prisma.favorite.create({ data: { userId, productId } });
  } catch {
    // A parallel click already created it (unique pair): it is a favourite either way.
  }
  return true;
}
