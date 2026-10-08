"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { findOrderNumberByPhone } from "@/services/orders";

const lookupSchema = z.object({
  number: z.string().trim().toUpperCase().regex(/^FB-[A-Z0-9]{6,10}$/, "Numărul are forma FB-XXXXXXXX"),
  phone: z.string().trim().min(9, "Introdu telefonul folosit la comandă").max(20),
});

export type LookupState = { error?: string };

/** Order lookup requires both the order number and the phone used at checkout. */
export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const parsed = lookupSchema.safeParse({
    number: formData.get("number"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide" };

  const number = await findOrderNumberByPhone(parsed.data.number, parsed.data.phone);
  if (!number) return { error: "Nu am găsit nicio comandă cu aceste date." };
  redirect(`/order/${number}`);
}
