"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { ORDER_STATUSES } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { objectIdSchema } from "@/lib/validation/common";

const schema = z.object({ id: objectIdSchema, status: z.enum(ORDER_STATUSES) });

export async function updateOrderStatus(id: string, status: string): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = schema.safeParse({ id, status });
  if (!parsed.success) return { error: "Status invalid." };
  await prisma.order.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  refresh();
  return {};
}
