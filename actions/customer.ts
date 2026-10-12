"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { createSession, deleteSession, getSessionUser, requireUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { defaultLocale, fill, isLocale, localizePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { linkMessage, mailEnabled, sendMail } from "@/lib/mail";
import { consumeAll, RATE_LIMITS, resetLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import {
  ACCOUNT_ERROR_KEYS,
  addressSchema,
  forgotSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
  resetSchema,
  safeNext,
  signInSchema,
  type AccountErrorKey,
} from "@/lib/validation/account";
import {
  AccountError,
  authenticate,
  bumpSessionVersion,
  changePassword,
  issueToken,
  registerCustomer,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from "@/services/accounts";
import {
  addAddress,
  deleteAddress,
  isFavorite,
  listAddresses,
  toggleFavorite,
  updateProfile,
} from "@/services/customer";
import { prisma } from "@/lib/prisma";

export type AccountFormState = {
  error?: string;
  notice?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of non-secret fields so a failed submit keeps what was typed. */
  values?: Record<string, string>;
};

function context(formData: FormData) {
  const raw = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDictionary(locale);
  return { locale, t, href: (path: string) => localizePath(locale, path) };
}

function fieldErrors(error: z.ZodError, t: ReturnType<typeof getDictionary>) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (out[key]) continue;
    const message = issue.message as AccountErrorKey;
    out[key] = (ACCOUNT_ERROR_KEYS as readonly string[]).includes(message) ? t.me.errors[message] : t.me.errors.generic;
  }
  return out;
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

async function ip() {
  return clientIp(await headers());
}

async function sendVerification(userId: string, email: string, locale: Locale) {
  if (!mailEnabled()) return false;
  const t = getDictionary(locale);
  const token = await issueToken(userId, "EMAIL_VERIFY");
  const link = absoluteUrl(localizePath(locale, `/account/verify?token=${token}`));
  return sendMail(linkMessage(email, t.me.verify.mailSubject, t.me.verify.mailIntro, t.me.verify.mailButton, link, t.me.verify.mailOutro));
}

// ───────────────────────── Sign up, sign in, sign out ─────────────────────────

export async function registerAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { locale, t, href } = context(formData);
  const values = { name: text(formData, "name"), email: text(formData, "email"), phone: text(formData, "phone") };
  const parsed = registerSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t), values };

  const limited = await consumeAll([{ rule: RATE_LIMITS.registerIp, id: await ip() }]);
  if (!limited.ok) return { error: t.me.register.tooMany, values };

  let user;
  try {
    user = await registerCustomer(parsed.data);
  } catch (error) {
    if (error instanceof AccountError && error.code === "emailTaken") {
      return { error: t.me.register.taken, fieldErrors: { email: t.me.register.taken }, values };
    }
    throw error;
  }
  await createSession(user.id, "CUSTOMER", user.sessionVersion ?? 0);
  await sendVerification(user.id, user.email, locale);
  redirect(safeNext(formData.get("next"), href("/account")));
}

export async function signInAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t, href } = context(formData);
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ email: values.email, password: text(formData, "password") });
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t), values };

  // Same brute-force guard as the staff sign-in (shared counters): per IP and per e-mail.
  const limited = await consumeAll([
    { rule: RATE_LIMITS.loginIp, id: await ip() },
    { rule: RATE_LIMITS.loginAccount, id: parsed.data.email },
  ]);
  if (!limited.ok) return { error: fill(t.me.signIn.tooMany, { minutes: Math.ceil(limited.retryAfterSeconds / 60) }), values };

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: t.me.signIn.wrong, values };
  await resetLimit(RATE_LIMITS.loginAccount, parsed.data.email);
  await createSession(user.id, user.role, user.sessionVersion);
  redirect(safeNext(formData.get("next"), href("/account")));
}

export async function signOutAction(formData: FormData) {
  const { href } = context(formData);
  await deleteSession();
  redirect(href("/"));
}

/** Ends every session of the account (this one included). */
export async function signOutEverywhereAction(formData: FormData) {
  const { href } = context(formData);
  const user = await requireUser(href("/account/login"));
  await bumpSessionVersion(user.id);
  await deleteSession();
  redirect(href("/account/login"));
}

// ───────────────────────── Password reset and e-mail verification ─────────────────────────

export async function forgotPasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { locale, t } = context(formData);
  const values = { email: text(formData, "email") };
  // No mail service: say so instead of claiming a message was sent.
  if (!mailEnabled()) return { error: t.me.forgot.unavailable, values };
  const parsed = forgotSchema.safeParse(values);
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t), values };

  const limited = await consumeAll([
    { rule: RATE_LIMITS.resetIp, id: await ip() },
    { rule: RATE_LIMITS.resetAccount, id: parsed.data.email },
  ]);
  if (!limited.ok) return { error: fill(t.me.forgot.tooMany, { minutes: Math.ceil(limited.retryAfterSeconds / 60) }), values };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true, blockedAt: true } });
  if (user && !user.blockedAt) {
    const token = await issueToken(user.id, "PASSWORD_RESET");
    const link = absoluteUrl(localizePath(locale, `/account/reset?token=${token}`));
    const sent = await sendMail(
      linkMessage(user.email, t.me.forgot.mailSubject, t.me.forgot.mailIntro, t.me.forgot.mailButton, link, t.me.forgot.mailOutro),
    );
    if (!sent) return { error: t.me.forgot.failed, values };
  }
  // The same answer whether or not the address has an account.
  return { notice: t.me.forgot.sent };
}

export async function resetPasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t, href } = context(formData);
  const parsed = resetSchema.safeParse({ token: text(formData, "token"), password: text(formData, "password") });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error, t);
    return errors.token ? { error: t.me.reset.invalid } : { error: t.me.errors.form, fieldErrors: errors };
  }
  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof AccountError) return { error: t.me.reset.invalid };
    throw error;
  }
  // Every older session is revoked; the customer signs in again with the new password.
  await deleteSession();
  redirect(href("/account/login?reset=1"));
}

export async function verifyEmailAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t } = context(formData);
  try {
    await verifyEmailWithToken(text(formData, "token"));
  } catch (error) {
    if (error instanceof AccountError) return { error: t.me.verify.invalid };
    throw error;
  }
  return { notice: t.me.verify.done };
}

export async function resendVerificationAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { locale, t, href } = context(formData);
  const user = await requireUser(href("/account/login"));
  if (user.emailVerified) return { notice: t.me.verify.done };
  if (!mailEnabled()) return { error: t.me.verify.unavailable };
  const limited = await consumeAll([{ rule: RATE_LIMITS.verifyAccount, id: user.id }]);
  if (!limited.ok) return { error: fill(t.me.forgot.tooMany, { minutes: Math.ceil(limited.retryAfterSeconds / 60) }) };
  return (await sendVerification(user.id, user.email, locale)) ? { notice: t.me.verify.resent } : { error: t.me.forgot.failed };
}

// ───────────────────────── Profile, password, addresses, favourites ─────────────────────────

export async function updateProfileAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t, href } = context(formData);
  const user = await requireUser(href("/account/login"));
  const values = { name: text(formData, "name"), phone: text(formData, "phone") };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t), values };
  await updateProfile(user.id, parsed.data);
  refresh();
  return { notice: t.me.profile.saved };
}

export async function changePasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t, href } = context(formData);
  const user = await requireUser(href("/account/login"));
  const parsed = passwordChangeSchema.safeParse({ current: text(formData, "current"), next: text(formData, "next") });
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t) };
  // Guessing the current password from a hijacked session is brute force too.
  const limited = await consumeAll([{ rule: RATE_LIMITS.loginAccount, id: user.email }]);
  if (!limited.ok) return { error: fill(t.me.signIn.tooMany, { minutes: Math.ceil(limited.retryAfterSeconds / 60) }) };
  try {
    const version = await changePassword(user.id, parsed.data.current, parsed.data.next);
    // Other devices are signed out; this one gets a fresh cookie with the new version.
    await createSession(user.id, user.role, version);
  } catch (error) {
    if (error instanceof AccountError && error.code === "wrongPassword") {
      return { error: t.me.profile.wrongPassword, fieldErrors: { current: t.me.profile.wrongPassword } };
    }
    throw error;
  }
  await resetLimit(RATE_LIMITS.loginAccount, user.email);
  return { notice: t.me.profile.passwordChanged };
}

export async function addAddressAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const { t, href } = context(formData);
  const user = await requireUser(href("/account/login"));
  const values = { label: text(formData, "label"), address: text(formData, "address") };
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) return { error: t.me.errors.form, fieldErrors: fieldErrors(parsed.error, t), values };
  if (!(await addAddress(user.id, parsed.data))) return { error: t.me.addresses.limit, values };
  refresh();
  return { notice: t.me.addresses.saved };
}

export async function deleteAddressAction(formData: FormData) {
  const { href } = context(formData);
  const user = await requireUser(href("/account/login"));
  await deleteAddress(user.id, text(formData, "id"));
  refresh();
}

/** Heart button: the state for a product (and whether anyone is signed in). */
export async function favoriteStateAction(productId: string) {
  const user = await getSessionUser();
  if (!user) return { signedIn: false, favorite: false };
  return { signedIn: true, favorite: await isFavorite(user.id, productId) };
}

export async function toggleFavoriteAction(productId: string) {
  const user = await getSessionUser();
  if (!user) return { signedIn: false, favorite: false };
  const favorite = await toggleFavorite(user.id, productId);
  return { signedIn: true, favorite };
}

/** What checkout may pre-fill for the signed-in customer (nothing for guests). */
export async function checkoutProfileAction() {
  const user = await getSessionUser();
  if (!user) return null;
  return { name: user.name, email: user.email, phone: user.phone ?? "", addresses: await listAddresses(user.id) };
}
