"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changeUserBlocked, changeUserRole } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";

/** Role and block controls for one user; every change asks for confirmation first. */
export function UserControls({ id, email, role, blocked, self }: { id: string; email: string; role: "CUSTOMER" | "ADMIN"; blocked: boolean; self: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(question: string, fn: () => Promise<{ error?: string }>) {
    if (!window.confirm(question)) return;
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
    });
  }

  if (self) return <p className="text-sm text-muted">Acesta este contul tău: rolul și accesul lui nu pot fi schimbate de aici.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {role === "CUSTOMER" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(`Faci din ${email} administrator? Va avea acces complet la panou.`, () => changeUserRole(id, "ADMIN"))}
          >
            Fă administrator
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(`Retragi drepturile de administrator pentru ${email}?`, () => changeUserRole(id, "CUSTOMER"))}
          >
            Retrage drepturile de administrator
          </Button>
        )}
        <Button
          variant={blocked ? "outline" : "dark"}
          size="sm"
          disabled={pending}
          onClick={() =>
            act(
              blocked ? `Deblochezi contul ${email}?` : `Blochezi contul ${email}? Toate sesiunile lui vor fi închise.`,
              () => changeUserBlocked(id, !blocked),
            )
          }
        >
          {blocked ? "Deblochează contul" : "Blochează contul"}
        </Button>
        {pending && <Loader2 className="size-5 animate-spin text-muted" aria-label="Se salvează" />}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}
