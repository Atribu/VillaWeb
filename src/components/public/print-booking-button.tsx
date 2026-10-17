"use client";

import type { AppLocale } from "@/lib/i18n";
export function PrintBookingButton({ locale }: { locale: AppLocale }) {
  return <button type="button" onClick={() => window.print()} className="serene-button-secondary px-5 py-3 text-sm font-semibold print:hidden">
    {locale === "en" ? "Print / Save PDF" : "Yazdir / PDF olarak kaydet"}
  </button>;
}
