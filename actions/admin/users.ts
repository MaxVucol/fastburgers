"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminI18n } from "@/lib/i18n/admin/server";
import { objectIdSchema } from "@/lib/validation/common";
import { AccountError, setUserBlocked, setUserRole } from "@/services/accounts";

async function run(fn: () => Promise<void>): Promise<{ error?: string }> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AccountError) {
      const { user } = (await getAdminI18n()).a;
      const messages: Partial<Record<AccountError["code"], string>> = { self: user.errSelf, lastAdmin: user.errLastAdmin, notFound: user.errNotFound };
      return { error: messages[error.code] ?? user.errRefused };
    }
    throw error;
  }
  refresh();
  return {};
}

/** Role change: administrators only (checked here), never on oneself or the last administrator. */
export async function changeUserRole(id: string, role: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: objectIdSchema, role: z.enum(["CUSTOMER", "ADMIN"]) }).safeParse({ id, role });
  if (!parsed.success) return { error: (await getAdminI18n()).a.common.invalidRequest };
  return run(() => setUserRole(admin, parsed.data.id, parsed.data.role));
}

export async function changeUserBlocked(id: string, blocked: boolean): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: objectIdSchema, blocked: z.boolean() }).safeParse({ id, blocked });
  if (!parsed.success) return { error: (await getAdminI18n()).a.common.invalidRequest };
  return run(() => setUserBlocked(admin, parsed.data.id, parsed.data.blocked));
}
