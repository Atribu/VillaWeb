import { NextResponse } from "next/server";
import { APP_LOCALE_COOKIE_NAME, normalizeAppLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = normalizeAppLocale(body?.locale);

  const response = NextResponse.json({ ok: true, locale });

  response.cookies.set(APP_LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
