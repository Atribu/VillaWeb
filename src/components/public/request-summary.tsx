import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";
import type { RequestPricingBreakdown } from "@/lib/demo-operations";
import { isDateKey } from "@/lib/booking-dates";
import s from "@/components/site-templates/stay-pages.module.css";

export function RequestSummary({ villa, checkIn, checkOut, pricing, guestCount, locale }: {
  villa: CatalogVilla; checkIn: string; checkOut: string; pricing?: RequestPricingBreakdown; guestCount?: number; locale: AppLocale;
}) {
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const item = getLocalizedVilla(villa, locale);
  return <div className={s.summaryCard}>
    {/* Uploaded WebP covers do not need another server-side conversion. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {item.coverImageUrl && <img className={s.summaryPhoto} src={item.coverImageUrl} alt={item.coverAlt} />}
    <div className={s.summaryContent}>
      <p className={s.eyebrow}>{t("KONAKLAMA ÖZETİNİZ", "YOUR STAY AT A GLANCE")}</p>
      <h2>{item.title}</h2>
      <p className={s.note}>{item.locationLabel} · {item.capacity} {t("kişilik", "guests max")}</p>
      <div className={s.summaryDates}>
        <div><span>{t("GİRİŞ", "CHECK-IN")}</span><strong>{isDateKey(checkIn) ? formatShortDate(checkIn, locale) : t("Tarih seçin", "Choose dates")}</strong></div>
        <div><span>{t("ÇIKIŞ", "CHECK-OUT")}</span><strong>{isDateKey(checkOut) ? formatShortDate(checkOut, locale) : t("Tarih seçin", "Choose dates")}</strong></div>
      </div>
      {pricing ? <>
        <dl className={s.dataRows} aria-live="polite">
          <div><dt>{t("Konaklama", "Stay")}</dt><dd>{pricing.nightCount} {t("gece", "nights")}{guestCount ? ` · ${guestCount} ${t("misafir", "guests")}` : ""}</dd></div>
          <div><dt>{t("Konaklama tutarı", "Stay subtotal")}</dt><dd>{formatCurrency(pricing.subtotal, locale)}</dd></div>
          {pricing.activeDiscountTotal > 0 && <div><dt>{pricing.activeDiscountTitle || t("Kampanya indirimi", "Offer discount")}</dt><dd>−{formatCurrency(pricing.activeDiscountTotal, locale)}</dd></div>}
          <div><dt>{t("Temizlik ücreti", "Cleaning fee")}</dt><dd>{formatCurrency(pricing.cleaningFee, locale)}</dd></div>
          {pricing.couponDiscountTotal > 0 && <div><dt>{t("Kupon indirimi", "Coupon discount")}</dt><dd>−{formatCurrency(pricing.couponDiscountTotal, locale)}</dd></div>}
          <div className={s.total}><dt>{t("Toplam", "Total")}</dt><dd>{formatCurrency(pricing.grandTotal, locale)}</dd></div>
        </dl>
        <p className={s.notice}>{t("Talep göndermek kesin rezervasyon değildir. Ekibimiz onay ve ödeme adımları için sizinle iletişime geçer.", "An inquiry is not a confirmed reservation. Our team will contact you about confirmation and payment.")}</p>
      </> : <p className={s.notice}>{t("Uygun tarihleri seçtiğinizde konaklamanızın fiyatı burada görünecek.", "Choose available dates to see your stay price here.")}</p>}
      {(item.damageDeposit ?? 0) > 0 && <p className={s.note} style={{ marginTop: 16 }}>{t("Ayrıca hasar depozitosu", "Additional damage deposit")}: {formatCurrency(item.damageDeposit ?? 0, locale)}</p>}
      {item.extraFeeNotes && <p className={s.note} style={{ marginTop: 12 }}>{item.extraFeeNotes}</p>}
    </div>
  </div>;
}
