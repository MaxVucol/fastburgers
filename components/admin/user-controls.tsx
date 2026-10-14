"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changeUserBlocked, changeUserRole } from "@/actions/admin/users";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/config";

/** Role and block controls for one user; every change asks for confirmation first. */
export function UserControls({ id, email, role, blocked, self }: { id: string; email: string; role: "CUSTOMER" | "ADMIN"; blocked: boolean; self: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { a } = useAdminI18n();
  const u = a.user;

  function act(question: string, fn: () => Promise<{ error?: string }>) {
    if (!window.confirm(question)) return;
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
    });
  }

  if (self) return <p className="text-sm text-muted">{u.self}</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {role === "CUSTOMER" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(fill(u.makeAdminConfirm, { email }), () => changeUserRole(id, "ADMIN"))}
          >
            {u.makeAdmin}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(fill(u.removeAdminConfirm, { email }), () => changeUserRole(id, "CUSTOMER"))}
          >
            {u.removeAdmin}
          </Button>
        )}
        <Button
          variant={blocked ? "outline" : "dark"}
          size="sm"
          disabled={pending}
          onClick={() =>
            act(
              blocked ? fill(u.unblockConfirm, { email }) : fill(u.blockConfirm, { email }),
              () => changeUserBlocked(id, !blocked),
            )
          }
        >
          {blocked ? u.unblock : u.block}
        </Button>
        {pending && <Loader2 className="size-5 animate-spin text-muted" aria-label={a.shell.saving} />}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}
