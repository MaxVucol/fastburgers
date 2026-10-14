"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { translateAdminMessage, type AdminDictionary } from "@/lib/i18n/admin";

type AdminI18nValue = {
  locale: Locale;
  a: AdminDictionary;
  /** Translates a message that came from shared validation or a service (Romanian source text). */
  msg: (message: string) => string;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

export function AdminI18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: AdminDictionary; children: React.ReactNode }) {
  const value = useMemo<AdminI18nValue>(
    () => ({ locale, a: dictionary, msg: (message) => translateAdminMessage(dictionary, message) }),
    [locale, dictionary],
  );
  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n(): AdminI18nValue {
  const value = useContext(AdminI18nContext);
  if (!value) throw new Error("useAdminI18n must be used inside <AdminI18nProvider>");
  return value;
}
