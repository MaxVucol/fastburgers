import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_CALLBACK_PATH,
  GOOGLE_FLOW_COOKIE,
  googleAuthorizationUrl,
  googleCookieOptions,
  newGoogleFlow,
  readGoogleConfig,
  sealGoogleCookie,
} from "@/lib/auth/google";
import { getSessionUser } from "@/lib/auth/session";
import { defaultLocale, isLocale, localizePath } from "@/lib/i18n/config";
import { safeNext } from "@/lib/validation/account";

/**
 * Start of "Continue with Google": /auth/google?intent=signin|link&lang=ro&next=/path
 * Sends the visitor to Google with a fresh state, nonce and PKCE challenge (kept in a signed cookie).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lang = params.get("lang");
  const locale = isLocale(lang) ? lang : defaultLocale;
  const intent = params.get("intent") === "link" ? "link" : "signin";
  const back = (path: string) => NextResponse.redirect(new URL(localizePath(locale, path), request.nextUrl.origin));

  const config = readGoogleConfig();
  if (!config) return back(intent === "link" ? "/account/profile?google=unavailable" : "/account/login?google=unavailable");

  if (intent === "link") {
    // Connecting Google needs a signed-in customer account.
    const user = await getSessionUser();
    if (!user) return back(`/account/login?next=${encodeURIComponent(localizePath(locale, "/account/profile"))}`);
    if (user.role !== "CUSTOMER") return back("/account/profile?google=notAllowed");
  }

  const next = safeNext(params.get("next"), localizePath(locale, "/account"));
  const flow = newGoogleFlow(intent, next, locale);
  (await cookies()).set(GOOGLE_FLOW_COOKIE, await sealGoogleCookie("flow", flow), googleCookieOptions());
  return NextResponse.redirect(googleAuthorizationUrl(config, flow, new URL(GOOGLE_CALLBACK_PATH, request.nextUrl.origin).toString()));
}
