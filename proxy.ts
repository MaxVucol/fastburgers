import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { defaultLocale, isLocale, LOCALE_COOKIE, splitLocale } from "@/lib/i18n/config";

// 1. Admin: optimistic gate. Authoritative checks happen in requireAdmin() inside every
//    admin page and Server Action.
// 2. Public site: Romanian has no URL prefix. Unprefixed URLs are rewritten to /ro/…,
//    /ro/… is redirected to the clean URL, /ru/… and /en/… are served as is.
//    A remembered language choice (cookie) redirects unprefixed URLs to that language.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (session?.role === "ADMIN") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const segment = pathname.split("/")[1];

  if (segment === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = splitLocale(pathname).path;
    return NextResponse.redirect(url, 308);
  }

  if (isLocale(segment)) return NextResponse.next();

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  const url = request.nextUrl.clone();
  if (isLocale(preferred) && preferred !== defaultLocale && request.method === "GET") {
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Everything except Next internals, API-like routes, metadata files and static assets.
    "/((?!_next/|__next|media/|images/|favicon.ico|sitemap.xml|robots.txt|.*\\.[a-zA-Z0-9]{2,5}$).*)",
  ],
};
