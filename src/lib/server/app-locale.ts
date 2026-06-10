import { cookies, headers } from "next/headers";
import { APP_LOCALE_COOKIE_NAME, normalizeAppLocale } from "@/lib/i18n";

export async function getCurrentLocale() {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-app-locale");

  if (headerLocale) {
    return normalizeAppLocale(headerLocale);
  }

  const cookieStore = await cookies();
  return normalizeAppLocale(cookieStore.get(APP_LOCALE_COOKIE_NAME)?.value);
}
