"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { adminButton } from "@/components/admin/admin-ui";

/** A page of the panel failed to load: say so plainly and offer a retry (nothing was changed). */
export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { a } = useAdminI18n();
  return (
    <div role="alert" className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-line bg-paper px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-bold">{a.ui.errorTitle}</h1>
      <p className="mt-1 text-sm text-muted">{a.ui.errorText}</p>
      <button type="button" className={`${adminButton.primary} mt-5`} onClick={() => retry()}>
        <RotateCcw className="size-4" aria-hidden /> {a.ui.retry}
      </button>
    </div>
  );
}
