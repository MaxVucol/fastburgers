"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { ORDER_STATUSES } from "@/lib/order-status";
import { objectIdSchema } from "@/lib/validation/common";
import { changeOrderStatus, StatusChangeError } from "@/services/orders";

const schema = z.object({ id: objectIdSchema, status: z.enum(ORDER_STATUSES) });

const MESSAGES: Record<StatusChangeError["code"], string> = {
  notFound: "Comanda nu mai există.",
  notAllowed: "Această schimbare de status nu este permisă din statusul curent.",
  conflict: "Statusul a fost schimbat între timp de altcineva. Reîncarcă pagina.",
};

export async function updateOrderStatus(id: string, status: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ id, status });
  if (!parsed.success) return { error: "Status invalid." };
  try {
    await changeOrderStatus(admin, parsed.data.id, parsed.data.status);
  } catch (error) {
    if (error instanceof StatusChangeError) return { error: MESSAGES[error.code] };
    throw error;
  }
  refresh();
  return {};
}
