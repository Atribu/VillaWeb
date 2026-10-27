"use client";

import type { AppLocale } from "@/lib/i18n";
import s from "@/components/site-templates/support-pages.module.css";
export function PrintBookingButton({ locale }: { locale: AppLocale }) {
  return <button type="button" onClick={() => window.print()} className={s.secondaryButton}>
    {locale === "en" ? "Print / Save PDF" : "Yazdır / PDF olarak kaydet"}
  </button>;
}
