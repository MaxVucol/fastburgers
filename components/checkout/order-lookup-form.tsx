"use client";

import { startTransition, useActionState } from "react";
import { Loader2, Search } from "lucide-react";
import { lookupOrder, type LookupState } from "@/actions/account";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function OrderLookupForm() {
  const { locale, t } = useI18n();
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
      <input type="hidden" name="locale" value={locale} />
      <Field label={t.account.number} htmlFor="number" required>
        <Input id="number" name="number" placeholder="FB-XXXXXXXX" autoCapitalize="characters" required />
      </Field>
      <Field label={t.account.phone} htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder={t.checkout.phonePlaceholder} required />
      </Field>
      {state.error && (
        <p className="text-sm font-medium text-accent-ink" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="dark" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : <Search className="size-4.5" aria-hidden />}
        {t.account.submit}
      </Button>
    </form>
  );
}
