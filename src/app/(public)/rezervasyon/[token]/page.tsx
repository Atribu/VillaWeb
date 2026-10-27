import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintBookingButton } from "@/components/public/print-booking-button";
import { SiteIcon } from "@/components/site-templates/site-icon";
import e from "@/components/site-templates/editorial-pages.module.css";
import s from "@/components/site-templates/support-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getPublicBookingConfirmation } from "@/lib/server/demo-operations-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import "./print.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return { title: pickLocalized(locale, "Rezervasyon durumu", "Booking status"), referrer: "no-referrer", robots: { index: false, follow: false } };
}

type Props = { params: Promise<{ token: string }> };

export default async function BookingConfirmationPage({ params }: Props) {
  const { token } = await params;
  const locale = await getCurrentLocale();
  const confirmation = await getPublicBookingConfirmation(token);
  if (!confirmation) notFound();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const isConfirmed = confirmation.isPaid;
  const isCancelled = confirmation.status === "CANCELLED";
  const status = isCancelled ? "cancelled" : isConfirmed ? "confirmed" : "pending";
  const villaTitle = locale === "en" ? confirmation.villa.titleEn || confirmation.villa.title : confirmation.villa.title;
  const href = (path: string) => getDemoCompanySiteHref(confirmation.companySlug ?? "", path);

  return <div className={`${e.page} booking-document`}>
    <header className={s.bookingHeader}>
      <p className={e.eyebrow}>{t("REZERVASYON DURUMUNUZ", "YOUR BOOKING STATUS")}</p>
      <h1 className={e.title}>{isCancelled ? t("Planınız", "Your plans") : isConfirmed ? t("Tatiliniz", "Your stay") : t("Tatilinize", "One step")}<br /><em>{isCancelled ? t("iptal edildi.", "have been cancelled.") : isConfirmed ? t("kesinleşti.", "is confirmed.") : t("bir adım daha.", "closer to your stay.")}</em></h1>
      <div className={s.status} data-status={status}><SiteIcon name={isCancelled ? "close" : isConfirmed ? "check" : "calendar"} />{isCancelled ? t("Rezervasyon iptal edildi", "Booking cancelled") : isConfirmed ? t("Ödeme ve rezervasyon onaylandı", "Payment and booking confirmed") : t("Ödeme onayı bekleniyor", "Awaiting payment confirmation")}</div>
      <p className={s.reference}>{t("Talep referansı", "Inquiry reference")}: {confirmation.id}</p>
    </header>
    <div className={s.bookingLayout}>
      <section className={s.bookingSummary}>
        <p className={e.eyebrow}>{t("KONAKLAMANIZ", "YOUR STAY")}</p><h2>{villaTitle}</h2>
        <dl className={s.bookingFields}>
          <div><dt>{t("Giriş", "Check-in")}</dt><dd><time dateTime={confirmation.checkIn}>{formatShortDate(confirmation.checkIn, locale)}</time>{confirmation.villa.checkInTime && <><br />{confirmation.villa.checkInTime}</>}</dd></div>
          <div><dt>{t("Çıkış", "Check-out")}</dt><dd><time dateTime={confirmation.checkOut}>{formatShortDate(confirmation.checkOut, locale)}</time>{confirmation.villa.checkOutTime && <><br />{confirmation.villa.checkOutTime}</>}</dd></div>
          <div><dt>{t("Misafir", "Guest")}</dt><dd>{confirmation.fullName}</dd></div>
          <div><dt>{t("Misafir sayısı", "Guests")}</dt><dd>{confirmation.guestCount}</dd></div>
          <div className={s.bookingCompany}><dt>{t("Firma", "Company")}</dt><dd>{confirmation.companyName}</dd></div>
        </dl>
      </section>
      <aside className={s.bookingTotals}>
        <h2>{t("TUTAR ÖZETİ", "PAYMENT SUMMARY")}</h2>
        <dl><div><dt>{t("Toplam konaklama tutarı", "Total stay amount")}</dt><dd>{formatCurrency(confirmation.totalAmount, locale)}</dd></div><div><dt>{t("Teyit edilen ödeme", "Verified payment")}</dt><dd>{formatCurrency(confirmation.paidTotal, locale)}</dd></div></dl>
        <p>{isCancelled ? t("İptal sonrası ödeme ve iade durumunu firma ile görüşün.", "Contact the company about payments and refunds after cancellation.") : t("Ödeme bilgileri firma tarafından teyit edildikçe güncellenir.", "Payment information is updated as it is verified by the company.")}</p>
      </aside>
    </div>
    <section className={s.bookingNext}>
      <h2>{isCancelled ? t("Bundan sonrası", "What happens next") : isConfirmed ? t("Şimdi tatili hayal edin.", "Now picture your holiday.") : t("Detayları netleştiriyoruz.", "Working out the details.")}</h2>
      <p>{isCancelled ? t("Bu rezervasyon aktif değildir. Ödeme ve iade bilgisi için firma ile iletişime geçebilirsiniz.", "This booking is no longer active. Contact the company for payment and refund information.") : isConfirmed ? t("Ödemeniz firma tarafından teyit edildi. Ekibimiz giriş bilgileri ve konaklama detayları için sizinle iletişime geçecek.", "Your payment has been confirmed by the company. Our team will contact you with check-in and stay details.") : t("Talebiniz alındı. Bu belge tek başına kesin rezervasyon anlamına gelmez. Firma rezervasyonunuzu ve ödemenizi teyit ettiğinde bu sayfadan güncel durumu görebilirsiniz.", "Your inquiry has been received. This document alone is not a confirmed reservation. Check this page for updates once the company has verified your booking and payment.")}</p>
    </section>
    <div className={`${s.bookingActions} booking-document-actions`}>
      <PrintBookingButton locale={locale} />
      {confirmation.companySlug && <><Link className={e.button} href={href(`/villalar/${encodeURIComponent(confirmation.villa.slug)}`)}>{t("Villayı incele", "View the villa")}<SiteIcon name="arrow" /></Link><Link className={s.secondaryButton} href={href("/iletisim")}>{t("Bize ulaşın", "Contact us")}</Link></>}
    </div>
    <p className={s.reference}>{t("Bu bağlantı misafir ve rezervasyon bilgilerinizi içerir. Yalnızca ilgili kişilerle paylaşın.", "This link contains your guest and booking details. Share it only with the people concerned.")}</p>
  </div>;
}
