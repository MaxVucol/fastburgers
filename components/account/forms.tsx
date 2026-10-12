"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  addAddressAction,
  changePasswordAction,
  forgotPasswordAction,
  registerAction,
  resendVerificationAction,
  resetPasswordAction,
  signInAction,
  updateProfileAction,
  verifyEmailAction,
  type AccountFormState,
} from "@/actions/customer";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Action = (prev: AccountFormState, formData: FormData) => Promise<AccountFormState>;

/**
 * Account forms submit through useActionState but keep what was typed on errors (the submit is
 * not a native form action, which would reset the fields). Server errors and notices are shown
 * in one live region above the button; a field error moves focus to its field.
 */
function useAccountForm(action: Action) {
  const { locale } = useI18n();
  const [state, run, pending] = useActionState<AccountFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const first = Object.keys(state.fieldErrors ?? {})[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("locale", locale);
    startTransition(() => run(data));
  }
  const fe = (name: string) => state.fieldErrors?.[name];
  const invalid = (name: string) => (fe(name) ? true : undefined);
  const describedBy = (name: string, hint = false) => (fe(name) ? `${name}-error` : hint ? `${name}-hint` : undefined);
  return [{ state, pending, onSubmit, fe, invalid, describedBy }, formRef] as const;
}

export function FormMessage({ state }: { state: AccountFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border-l-4 border-accent bg-accent-soft p-3.5 text-sm font-medium text-ink">
        <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-accent-ink" aria-hidden />
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p role="status" className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border-l-4 border-herb bg-herb-soft p-3.5 text-sm font-medium text-ink">
        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-herb" aria-hidden />
        {state.notice}
      </p>
    );
  }
  return null;
}

function Submit({ pending, label, busy, variant = "primary", className }: { pending: boolean; label: string; busy: string; variant?: "primary" | "dark"; className?: string }) {
  return (
    <Button type="submit" size="lg" variant={variant} className={cn("w-full", className)} disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="size-4.5 animate-spin" aria-hidden />}
      {pending ? busy : label}
    </Button>
  );
}

const linkClass = "font-semibold text-accent-ink underline-offset-4 hover:underline";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const { t, href } = useI18n();
  const [f, formRef] = useAccountForm(signInAction);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {notice && !f.state.error && <FormMessage state={{ notice }} />}
      <Field label={t.me.signIn.email} htmlFor="email" error={f.fe("email")} required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={f.state.values?.email} required aria-invalid={f.invalid("email")} aria-describedby={f.describedBy("email")} />
      </Field>
      <Field label={t.me.signIn.password} htmlFor="password" error={f.fe("password")} required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={f.invalid("password")} aria-describedby={f.describedBy("password")} />
      </Field>
      <p className="text-right text-sm">
        <Link href={href("/account/forgot")} className={linkClass}>{t.me.signIn.forgot}</Link>
      </p>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.signIn.submit} busy={t.me.signIn.submitting} />
      <p className="text-center text-sm text-muted">
        {t.me.signIn.noAccount}{" "}
        <Link href={href(next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register")} className={linkClass}>
          {t.me.signIn.register}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { t, href } = useI18n();
  const [f, formRef] = useAccountForm(registerAction);
  const v = f.state.values;
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t.me.register.name} htmlFor="name" error={f.fe("name")} required>
        <Input id="name" name="name" autoComplete="name" defaultValue={v?.name} required aria-invalid={f.invalid("name")} aria-describedby={f.describedBy("name")} />
      </Field>
      <Field label={t.me.register.email} htmlFor="email" error={f.fe("email")} required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v?.email} required aria-invalid={f.invalid("email")} aria-describedby={f.describedBy("email")} />
      </Field>
      <Field label={t.me.register.phone} htmlFor="phone" error={f.fe("phone")} hint={t.me.register.phoneHint}>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t.checkout.phonePlaceholder} defaultValue={v?.phone} aria-invalid={f.invalid("phone")} aria-describedby={f.describedBy("phone", true)} />
      </Field>
      <Field label={t.me.register.password} htmlFor="password" error={f.fe("password")} hint={t.me.register.passwordHint} required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={f.invalid("password")} aria-describedby={f.describedBy("password", true)} />
      </Field>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.register.submit} busy={t.me.register.submitting} />
      <p className="text-center text-sm text-muted">
        {t.me.register.haveAccount}{" "}
        <Link href={href(next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login")} className={linkClass}>
          {t.me.register.signIn}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { t, href } = useI18n();
  const [f, formRef] = useAccountForm(forgotPasswordAction);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      <Field label={t.me.forgot.email} htmlFor="email" error={f.fe("email")} required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={f.state.values?.email} required aria-invalid={f.invalid("email")} aria-describedby={f.describedBy("email")} />
      </Field>
      <FormMessage state={f.state} />
      {!f.state.notice && <Submit pending={f.pending} label={t.me.forgot.submit} busy={t.me.forgot.submitting} />}
      <p className="text-center text-sm">
        <Link href={href("/account/login")} className={linkClass}>{t.me.forgot.back}</Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { t, href } = useI18n();
  const [f, formRef] = useAccountForm(resetPasswordAction);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label={t.me.reset.password} htmlFor="password" error={f.fe("password")} hint={t.me.register.passwordHint} required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={f.invalid("password")} aria-describedby={f.describedBy("password", true)} />
      </Field>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.reset.submit} busy={t.me.reset.submitting} />
      {f.state.error === t.me.reset.invalid && (
        <p className="text-center text-sm">
          <Link href={href("/account/forgot")} className={linkClass}>{t.me.reset.requestNew}</Link>
        </p>
      )}
    </form>
  );
}

export function VerifyForm({ token }: { token: string }) {
  const { t, href } = useI18n();
  const [f, formRef] = useAccountForm(verifyEmailAction);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={f.state} />
      {f.state.notice ? (
        <Link href={href("/account")} className={linkClass}>{t.me.nav.overview}</Link>
      ) : (
        <Submit pending={f.pending} label={t.me.verify.submit} busy={t.me.verify.submit} />
      )}
    </form>
  );
}

export function ResendVerification() {
  const { t } = useI18n();
  const [f, formRef] = useAccountForm(resendVerificationAction);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span>{t.me.verify.banner}</span>
      {!f.state.notice && (
        <button type="submit" disabled={f.pending} className={cn(linkClass, "disabled:opacity-60")}>
          {t.me.verify.resend}
        </button>
      )}
      <span className="basis-full empty:hidden" aria-live="polite">
        {f.state.error ?? f.state.notice ?? ""}
      </span>
    </form>
  );
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const { t } = useI18n();
  const [f, formRef] = useAccountForm(updateProfileAction);
  const v = f.state.values;
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      <Field label={t.me.profile.name} htmlFor="name" error={f.fe("name")} required>
        <Input id="name" name="name" autoComplete="name" defaultValue={v?.name ?? name} required aria-invalid={f.invalid("name")} aria-describedby={f.describedBy("name")} />
      </Field>
      <Field label={t.me.profile.phone} htmlFor="phone" error={f.fe("phone")}>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v?.phone ?? phone} placeholder={t.checkout.phonePlaceholder} aria-invalid={f.invalid("phone")} aria-describedby={f.describedBy("phone")} />
      </Field>
      <Field label={t.me.profile.email} htmlFor="email" hint={t.me.profile.emailNote}>
        <Input id="email" type="email" value={email} readOnly disabled aria-describedby="email-hint" />
      </Field>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.profile.save} busy={t.me.profile.save} variant="dark" className="sm:w-auto sm:px-8" />
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [f, formRef] = useAccountForm(changePasswordAction);
  // Clear the password fields after a successful change.
  useEffect(() => {
    if (f.state.notice) formRef.current?.reset();
  }, [f.state, formRef]);
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      <Field label={t.me.profile.current} htmlFor="current" error={f.fe("current")} required>
        <Input id="current" name="current" type="password" autoComplete="current-password" required aria-invalid={f.invalid("current")} aria-describedby={f.describedBy("current")} />
      </Field>
      <Field label={t.me.profile.next} htmlFor="next" error={f.fe("next")} hint={t.me.register.passwordHint} required>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required aria-invalid={f.invalid("next")} aria-describedby={f.describedBy("next", true)} />
      </Field>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.profile.changePassword} busy={t.me.profile.changePassword} variant="dark" className="sm:w-auto sm:px-8" />
    </form>
  );
}

export function AddressForm() {
  const { t } = useI18n();
  const [f, formRef] = useAccountForm(addAddressAction);
  useEffect(() => {
    if (f.state.notice) formRef.current?.reset();
  }, [f.state, formRef]);
  const v = f.state.notice ? undefined : f.state.values;
  return (
    <form ref={formRef} onSubmit={f.onSubmit} noValidate className="space-y-4">
      <Field label={t.me.addresses.label} htmlFor="label" error={f.fe("label")} required>
        <Input id="label" name="label" placeholder={t.me.addresses.labelPlaceholder} defaultValue={v?.label} maxLength={40} required aria-invalid={f.invalid("label")} aria-describedby={f.describedBy("label")} />
      </Field>
      <Field label={t.me.addresses.address} htmlFor="address" error={f.fe("address")} hint={t.me.addresses.addressHint} required>
        <Textarea id="address" name="address" rows={2} autoComplete="street-address" defaultValue={v?.address} maxLength={200} required aria-invalid={f.invalid("address")} aria-describedby={f.describedBy("address", true)} />
      </Field>
      <FormMessage state={f.state} />
      <Submit pending={f.pending} label={t.me.addresses.add} busy={t.me.addresses.add} variant="dark" className="sm:w-auto sm:px-8" />
    </form>
  );
}

/** Layout for the sign-in / sign-up / reset cards. */
export function AuthCard({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="type-h2">{title}</h1>
      <p className="mt-2 text-muted">{lead}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
