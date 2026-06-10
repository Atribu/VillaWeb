export const APP_LOCALE_COOKIE_NAME = "villaweb-locale";

export type AppLocale = "tr" | "en";

export const DEFAULT_APP_LOCALE: AppLocale = "tr";

export function normalizeAppLocale(input?: string | null): AppLocale {
  if (!input) {
    return DEFAULT_APP_LOCALE;
  }

  const normalized = input.trim().toLowerCase();

  if (normalized.startsWith("en")) {
    return "en";
  }

  return "tr";
}

export function pickLocalized<T>(locale: AppLocale, trValue: T, enValue: T): T {
  return locale === "en" ? enValue : trValue;
}

export function getLocaleCode(locale: AppLocale) {
  return locale === "en" ? "EN" : "TR";
}

export function getLocaleName(locale: AppLocale) {
  return locale === "en" ? "English" : "Turkce";
}
