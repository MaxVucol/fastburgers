"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { objectIdSchema } from "@/lib/validation/common";
import { AccountError, setUserBlocked, setUserRole } from "@/services/accounts";

const MESSAGES: Partial<Record<AccountError["code"], string>> = {
  self: "Nu îți poți schimba propriul rol sau bloca propriul cont.",
  lastAdmin: "Acesta este ultimul administrator activ: numește întâi un alt administrator.",
  notFound: "Utilizatorul nu mai există.",
};

async function run(fn: () => Promise<void>): Promise<{ error?: string }> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AccountError) return { error: MESSAGES[error.code] ?? "Acțiune refuzată." };
    throw error;
  }
  refresh();
  return {};
}

/** Role change: administrators only (checked here), never on oneself or the last administrator. */
export async function changeUserRole(id: string, role: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: objectIdSchema, role: z.enum(["CUSTOMER", "ADMIN"]) }).safeParse({ id, role });
  if (!parsed.success) return { error: "Cerere invalidă." };
  return run(() => setUserRole(admin, parsed.data.id, parsed.data.role));
}

export async function changeUserBlocked(id: string, blocked: boolean): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: objectIdSchema, blocked: z.boolean() }).safeParse({ id, blocked });
  if (!parsed.success) return { error: "Cerere invalidă." };
  return run(() => setUserBlocked(admin, parsed.data.id, parsed.data.blocked));
}
