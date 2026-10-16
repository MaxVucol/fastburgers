"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminI18n } from "@/lib/i18n/admin/server";
import { ORDER_STATUSES } from "@/lib/order-status";
import { objectIdSchema } from "@/lib/validation/common";
import { sendOrderStatusEmail } from "@/services/order-emails";
import { changeOrderStatus, StatusChangeError } from "@/services/orders";

const schema = z.object({ id: objectIdSchema, status: z.enum(ORDER_STATUSES) });

export async function updateOrderStatus(id: string, status: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const { a } = await getAdminI18n();
  const parsed = schema.safeParse({ id, status });
  if (!parsed.success) return { error: a.status.invalid };
  try {
    await changeOrderStatus(admin, parsed.data.id, parsed.data.status);
  } catch (error) {
    if (error instanceof StatusChangeError) return { error: a.status[error.code] };
    throw error;
  }
  // Only after the change is saved; the e-mail cannot undo or delay it.
  after(() => sendOrderStatusEmail(parsed.data.id, parsed.data.status));
  refresh();
  return {};
}
