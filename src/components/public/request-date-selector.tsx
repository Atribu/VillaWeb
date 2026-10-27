"use client";

import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatShortDate } from "@/lib/villa-catalog";
import { VillaAvailabilityCard } from "@/components/villas/villa-availability-card";
import { isDateKey } from "@/lib/booking-dates";
import s from "@/components/site-templates/stay-pages.module.css";

type RequestDateSelectorProps = {
  villa: CatalogVilla; initialCheckIn?: string; initialCheckOut?: string;
  locale?: AppLocale; companySlug: string; validSelection?: boolean;
};

export function RequestDateSelector({ villa, initialCheckIn = "", initialCheckOut = "", locale = "tr", companySlug, validSelection = false }: RequestDateSelectorProps) {
  const router = useRouter();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const datesPresent = isDateKey(initialCheckIn) && isDateKey(initialCheckOut);
  function applyDates(checkIn: string, checkOut: string) {
    const params = new URLSearchParams({ company: companySlug, villa: villa.slug, checkIn, checkOut });
    router.replace(`/talep?${params}`, { scroll: false });
  }
  return <details className={s.dateEditor} open={!validSelection}>
    <summary>
      <span><span className={s.eyebrow}>{t("01 / TARİHLERİNİZ", "01 / YOUR DATES")}</span><strong>{datesPresent ? `${formatShortDate(initialCheckIn, locale)} – ${formatShortDate(initialCheckOut, locale)}` : t("Ne zaman kaçamak yapalım?", "When shall we get away?")}</strong></span>
      <span>{t("Düzenle", "Edit")}</span>
    </summary>
    <div style={{ marginTop: 20 }}>
      <VillaAvailabilityCard key={`${initialCheckIn}-${initialCheckOut}`} villa={villa} locale={locale} companySlug={companySlug}
        initialCheckIn={initialCheckIn} initialCheckOut={initialCheckOut} onSelect={applyDates} />
    </div>
  </details>;
}
