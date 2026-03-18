import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { canAccessPanelPath, getPanelHomePath } from "@/lib/auth/panel-access";
import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/panel")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname === "/panel/giris") {
    if (session) {
      return NextResponse.redirect(new URL(getPanelHomePath(session.role), request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/panel/giris", request.url));
  }

  if (!canAccessPanelPath(session.role, pathname)) {
    return NextResponse.redirect(new URL(getPanelHomePath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
