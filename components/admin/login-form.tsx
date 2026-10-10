"use client";

import { startTransition, useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        // Submit manually so React does not reset the fields after a failed attempt.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} />
      </Field>
      <Field label="Parolă" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && (
        <p className="text-sm font-medium text-accent-ink" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4.5 animate-spin" aria-hidden />}
        Intră în cont
      </Button>
    </form>
  );
}
