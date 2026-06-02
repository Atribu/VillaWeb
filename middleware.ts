import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEMO_COMPANY_COOKIE_NAME } from "@/lib/demo-companies";
import { canAccessPanelPath, getPanelHomePath } from "@/lib/auth/panel-access";
import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const companySlugFromUrl = request.nextUrl.searchParams.get("company");
  const companySlugFromCookie = request.cookies.get(DEMO_COMPANY_COOKIE_NAME)?.value;
  const resolvedCompanySlug =
    companySlugFromUrl?.trim().toLowerCase() || companySlugFromCookie?.trim().toLowerCase() || null;
  const requestHeaders = new Headers(request.headers);

  if (resolvedCompanySlug) {
    requestHeaders.set("x-demo-company-slug", resolvedCompanySlug);
  }

  function finalizeResponse(response: NextResponse) {
    if (resolvedCompanySlug) {
      response.cookies.set(DEMO_COMPANY_COOKIE_NAME, resolvedCompanySlug, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  }

  if (!pathname.startsWith("/panel")) {
    return finalizeResponse(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname === "/panel/giris") {
    if (session) {
      return finalizeResponse(
        NextResponse.redirect(new URL(getPanelHomePath(session.role), request.url)),
      );
    }

    return finalizeResponse(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  if (!session) {
    return finalizeResponse(NextResponse.redirect(new URL("/panel/giris", request.url)));
  }

  if (!canAccessPanelPath(session.role, pathname)) {
    return finalizeResponse(
      NextResponse.redirect(new URL(getPanelHomePath(session.role), request.url)),
    );
  }

  return finalizeResponse(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
