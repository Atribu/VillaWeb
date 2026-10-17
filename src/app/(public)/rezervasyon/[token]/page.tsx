import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PrintBookingButton } from "@/components/public/print-booking-button";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getPublicBookingConfirmation } from "@/lib/server/demo-operations-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import "./print.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rezervasyon Durumu",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
  },
};

type BookingConfirmationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { token } = await params;
  const [locale, confirmation] = await Promise.all([
    getCurrentLocale(),
    getPublicBookingConfirmation(token),
  ]);

  if (!confirmation) {
    notFound();
  }

  const isConfirmed = confirmation.isPaid;
  const isCancelled = confirmation.status === "CANCELLED";

  return (
    <Container className="booking-document py-14 sm:py-20">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="serene-card overflow-hidden">
          <div className={isConfirmed ? "bg-emerald-700 px-8 py-10 text-white" : "bg-ocean-panel px-8 py-10 text-white"}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              {pickLocalized(locale, "Rezervasyon durumu", "Booking status")}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {isCancelled ? pickLocalized(locale, "Rezervasyon iptal edildi", "Booking cancelled") : isConfirmed
                ? pickLocalized(locale, "Odeme alindi, rezervasyonun onaylandi", "Payment received, your booking is confirmed")
                : pickLocalized(locale, "Talebin alindi, odeme onayi bekleniyor", "Inquiry received, awaiting payment confirmation")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              {pickLocalized(
                locale,
                `Referans kodu ${confirmation.id}. Bu baglantiyi rezervasyon durumunu takip etmek icin saklayabilirsin.`,
                `Reference code ${confirmation.id}. Keep this link to track your booking status.`,
              )}
            </p>
          </div>

          <div className="grid gap-4 p-8 sm:grid-cols-2">
            {[
              [pickLocalized(locale, "Villa", "Villa"), confirmation.villa.title],
              [pickLocalized(locale, "Misafir", "Guest"), confirmation.fullName],
              [pickLocalized(locale, "Giris", "Check-in"), `${formatShortDate(confirmation.checkIn, locale)} ${confirmation.villa.checkInTime ?? ""}`],
              [pickLocalized(locale, "Cikis", "Check-out"), `${formatShortDate(confirmation.checkOut, locale)} ${confirmation.villa.checkOutTime ?? ""}`],
              [pickLocalized(locale, "Misafir sayisi", "Guests"), String(confirmation.guestCount)],
              [pickLocalized(locale, "Toplam", "Total"), formatCurrency(confirmation.totalAmount, locale)],
              [pickLocalized(locale, "Odenen", "Paid"), formatCurrency(confirmation.paidTotal, locale)],
              [pickLocalized(locale, "Firma", "Company"), confirmation.companyName],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[8px] bg-[var(--serene-surface-low)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--serene-outline)]">
                  {label}
                </p>
                <p className="mt-2 font-semibold text-[var(--serene-on-surface)]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="serene-card p-8">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--serene-on-surface)]">
            {isCancelled ? pickLocalized(locale, "Iptal bilgisi", "Cancellation") : isConfirmed
              ? pickLocalized(locale, "Siradaki adim", "Next step")
              : pickLocalized(locale, "Onay sureci", "Confirmation process")}
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--serene-on-surface-variant)]">
            {isCancelled ? pickLocalized(locale, "Bu rezervasyon aktif degildir. Odeme ve iade bilgisi icin firma ile iletisime gecebilirsiniz.", "This booking is no longer active. Contact the company for payment and refund information.") : isConfirmed
              ? pickLocalized(
                  locale,
                  "Odemeniz firma tarafindan teyit edildi. Ekibimiz giris bilgileri ve konaklama detaylari icin sizinle iletisime gececek.",
                  "Your payment has been confirmed by the company. Our team will contact you with check-in and stay details.",
                )
              : pickLocalized(
                  locale,
                  "Talebiniz alindi. Bu belge tek basina kesin rezervasyon anlamina gelmez. Firma rezervasyonunuzu ve odemenizi teyit ettiginde bu sayfadan guncel durumu gorebilirsiniz.",
                  "Your inquiry has been received. This document alone is not a confirmed reservation. Check this page for updates once the company has verified your booking and payment.",
                )}
          </p>
          <div className="booking-document-actions mt-6 flex flex-wrap gap-3">
            <PrintBookingButton locale={locale} />
            <Link href={`/villalar/${confirmation.villa.slug}`} className="serene-button-primary px-5 py-3 text-sm font-semibold">
              {pickLocalized(locale, "Villa detayina don", "Back to villa")}
            </Link>
            <Link href="/iletisim" className="serene-button-secondary px-5 py-3 text-sm font-semibold">
              {pickLocalized(locale, "Iletisime gec", "Contact us")}
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}
