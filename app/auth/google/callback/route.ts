import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeGoogleCode,
  GOOGLE_CALLBACK_PATH,
  GOOGLE_FLOW_COOKIE,
  GOOGLE_LINK_COOKIE,
  GoogleAuthError,
  googleCookieOptions,
  openGoogleCookie,
  readGoogleConfig,
  sameState,
  sealGoogleCookie,
  type GoogleFlow,
} from "@/lib/auth/google";
import { createSession, getSessionUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { defaultLocale, isLocale, localizePath } from "@/lib/i18n/config";
import { consumeAll, RATE_LIMITS } from "@/lib/rate-limit";
import { signInWithGoogle } from "@/services/oauth";

/**
 * Google sends the visitor back here with `code` and `state` (or `error`, e.g. when they cancel).
 * Every failure ends on the sign-in (or profile) page with a short code the page explains; no token,
 * code or e-mail address is logged.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const jar = await cookies();
  const flow = await openGoogleCookie<GoogleFlow>("flow", jar.get(GOOGLE_FLOW_COOKIE)?.value);
  // One use only: the flow cookie goes whatever happens next.
  jar.delete(GOOGLE_FLOW_COOKIE);

  const locale = isLocale(flow?.locale) ? flow.locale : defaultLocale;
  const go = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));
  const back = (code: string) =>
    go(localizePath(locale, flow?.intent === "link" ? `/account/profile?google=${code}` : `/account/login?google=${code}`));

  // Missing or expired flow, or a state that is not ours: a forged or replayed callback.
  if (!flow || !sameState(flow.state, params.get("state"))) return back("failed");
  if (params.get("error")) return back(params.get("error") === "access_denied" ? "cancelled" : "failed");
  const code = params.get("code");
  const config = readGoogleConfig();
  if (!config) return back("unavailable");
  if (!code) return back("failed");

  const limited = await consumeAll([{ rule: RATE_LIMITS.googleIp, id: clientIp(request.headers) }]);
  if (!limited.ok) return back("tooMany");

  let profile;
  try {
    profile = await exchangeGoogleCode(config, flow, code, new URL(GOOGLE_CALLBACK_PATH, request.nextUrl.origin).toString());
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      console.error(`Google sign-in failed: ${error.code}`);
      return back(error.code === "unverifiedEmail" ? "unverified" : "failed");
    }
    throw error;
  }

  if (flow.intent === "link") {
    // Connecting to the signed-in account: nothing is linked yet. The account password confirms it
    // on the next page (re-authentication); until then the Google identity waits in a signed cookie.
    const user = await getSessionUser();
    if (!user) return go(localizePath(locale, "/account/login?google=linkExpired"));
    jar.set(GOOGLE_LINK_COOKIE, await sealGoogleCookie("link", { ...profile, uid: user.id }), googleCookieOptions());
    return go(localizePath(locale, "/account/link-google"));
  }

  const result = await signInWithGoogle(profile);
  if (result.kind === "notAllowed") return back("notAllowed");
  if (result.kind === "emailExists") {
    // The address has an account that is not linked to this Google account. Never link it
    // automatically: the visitor signs in with the password and then confirms the link.
    jar.set(GOOGLE_LINK_COOKIE, await sealGoogleCookie("link", { ...profile }), googleCookieOptions());
    const next = localizePath(locale, "/account/link-google");
    return go(localizePath(locale, `/account/login?google=exists&next=${encodeURIComponent(next)}`));
  }
  await createSession(result.userId, result.role, result.sessionVersion);
  return go(flow.next);
}
