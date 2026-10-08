"use client";

import { startTransition, useActionState } from "react";
import { Loader2, Search } from "lucide-react";
import { lookupOrder, type LookupState } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function OrderLookupForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, {});
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Field label="Număr comandă" htmlFor="number" required>
        <Input id="number" name="number" placeholder="FB-XXXXXXXX" autoCapitalize="characters" required />
      </Field>
      <Field label="Telefon" htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="07xx xxx xxx" required />
      </Field>
      {state.error && (
        <p className="text-sm font-medium text-accent" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="dark" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : <Search className="size-4.5" aria-hidden />}
        Urmărește comanda
      </Button>
    </form>
  );
}
