"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BOOKING_TERMS_VERSION } from "@/lib/booking-terms";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { RequestSummary } from "./request-summary";
import { RequestDateSelector } from "./request-date-selector";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";
import type { DemoCoupon, RequestPricingBreakdown } from "@/lib/demo-operations";

type RequestFormProps = {
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
  initialPricing: RequestPricingBreakdown;
  locale?: AppLocale;
  companySlug: string;
};

function getEmptyFieldErrorMessage(locale: AppLocale) {
  return pickLocalized(
    locale,
    "Ad soyad, telefon ve e-posta bilgisi zorunludur.",
    "Full name, phone number and email are required.",
  );
}

export function RequestForm({
  villa,
  checkIn,
  checkOut,
  initialPricing,
  locale = "tr",
  companySlug,
}: RequestFormProps) {
  const router = useRouter();
  const localizedVilla = useMemo(() => getLocalizedVilla(villa, locale), [locale, villa]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(Math.min(2, villa.capacity));
  const [message, setMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmationPath, setConfirmationPath] = useState("");
  const [couponCode, setCouponCode] = useState(initialPricing.couponCode ?? "");
  const [pricing, setPricing] = useState(initialPricing);
  const [appliedCoupon, setAppliedCoupon] = useState<DemoCoupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitTone, setSubmitTone] = useState<"success" | "error">("success");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetCouponState() {
    setPricing(initialPricing);
    setAppliedCoupon(null);
    setCouponMessage("");
  }

  async function handleApplyCoupon() {
    setCouponMessage("");

    if (!couponCode.trim()) {
      resetCouponState();
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const response = await fetch("/api/demo/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          villaSlug: villa.slug,
          checkIn,
          checkOut,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        pricing?: RequestPricingBreakdown;
        coupon?: DemoCoupon;
      };

      if (!response.ok || !payload.pricing) {
        resetCouponState();
        setCouponMessage(payload.error ?? pickLocalized(locale, "Kupon dogrulanamadi.", "Coupon could not be validated."));
        return;
      }

      setPricing(payload.pricing);
      setAppliedCoupon(payload.coupon ?? null);
      setCouponMessage(
        pickLocalized(
          locale,
          `${payload.coupon?.title ?? "Kupon"} basariyla uygulandi. Yeni toplam fiyat guncellendi.`,
          `${payload.coupon?.title ?? "Coupon"} applied successfully. The total price has been updated.`,
        ),
      );
    } catch {
      setCouponMessage(
        pickLocalized(
          locale,
          "Kupon kontrolu sirasinda baglanti hatasi olustu.",
          "A connection error occurred while validating the coupon.",
        ),
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setSubmitTone("error");
      setSubmitMessage(getEmptyFieldErrorMessage(locale));
      return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > villa.capacity) {
      setSubmitTone("error");
      setSubmitMessage(pickLocalized(locale, "Villa kapasitesine uygun bir misafir sayısı girin.", "Enter a guest count within the villa capacity."));
      return;
    }
    if (couponCode.trim() && pricing.couponCode?.toUpperCase() !== couponCode.trim().toUpperCase()) {
      setSubmitTone("error");
      setSubmitMessage(pickLocalized(locale, "Kuponu önce uygulayın veya kupon alanını temizleyin.", "Apply your coupon first or clear the coupon field."));
      return;
    }
    if (!termsAccepted) {
      setSubmitTone("error");
      setSubmitMessage(
        pickLocalized(
          locale,
          "Talep olusturmak icin kullanim kosullari ve KVKK metnini onaylamalisin.",
          "You must accept the terms and privacy notice before creating an inquiry.",
        ),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaSlug: villa.slug,
          checkIn,
          checkOut,
          guestCount,
          fullName,
          phone,
          email,
          message,
          couponCode: pricing.couponCode,
          termsAccepted,
          termsVersion: BOOKING_TERMS_VERSION,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        request?: {
          id: string;
          confirmationToken?: string;
        };
      };

      if (!response.ok || !payload.request) {
        setSubmitTone("error");
        setSubmitMessage(
          payload.error ?? pickLocalized(locale, "Talep kaydi olusturulamadi.", "The inquiry could not be created."),
        );
        return;
      }

      setSubmitTone("success");
      setConfirmationPath(
        payload.request.confirmationToken
          ? `/rezervasyon/${payload.request.confirmationToken}`
          : "",
      );
      setSubmitMessage(
        pickLocalized(
          locale,
          `Talebiniz bize ulaştı. Referans kodunuz: ${payload.request.id}. Ekibimiz sizinle iletişime geçecek.`,
          `Your inquiry has been received. Reference: ${payload.request.id}. Our team will contact you shortly.`,
        ),
      );
      setFullName("");
      setPhone("");
      setEmail("");
      setGuestCount(Math.min(2, localizedVilla.capacity));
      setMessage("");
      setTermsAccepted(false);
      setCouponCode("");
      setAppliedCoupon(null);
      setPricing(initialPricing);
      router.refresh();
    } catch {
      setSubmitTone("error");
      setSubmitMessage(
        pickLocalized(
          locale,
          "Talep kaydi sirasinda baglanti hatasi olustu.",
          "A connection error occurred while creating the inquiry.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(companySlug, path);
  return <div className={s.requestGrid}>
    <div className={s.requestMain}>
      <RequestDateSelector villa={villa} initialCheckIn={checkIn} initialCheckOut={checkOut} locale={locale} companySlug={companySlug} validSelection />
      <form onSubmit={handleSubmit}>
        <div className={s.formHeader}><p className={s.eyebrow}>{t("02 / SİZİ TANIYALIM", "02 / A LITTLE ABOUT YOU")}</p><h2>{t("Tatiliniz burada başlıyor.", "Your holiday starts here.")}</h2><p>{t("Size ulaşabileceğimiz bilgileri paylaşın. Gerisini birlikte planlayalım.", "Leave your contact details. We will plan the next steps together.")}</p></div>
        <fieldset disabled={isSubmitting} className={s.formGrid}>
          <legend className="sr-only">{t("İletişim ve misafir bilgileri", "Contact and guest details")}</legend>
          <label className={s.field}><span>{t("Ad soyad", "Full name")} *</span><input id="fullName" name="fullName" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t("Adınız ve soyadınız", "Your full name")} /></label>
          <label className={s.field}><span>{t("Misafir sayısı", "Guest count")} *</span><input id="guestCount" name="guestCount" type="number" min={1} max={villa.capacity} step={1} required value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))} /></label>
          <label className={s.field}><span>{t("Telefon", "Phone")} *</span><input id="phone" name="phone" type="tel" required autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+90 5xx xxx xx xx" /></label>
          <label className={s.field}><span>{t("E-posta", "Email")} *</span><input id="email" name="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="mail@example.com" /></label>
          <label className={`${s.field} ${s.fullWidth}`}><span>{t("Bizimle paylaşmak istediğiniz bir not", "Anything you would like us to know")}</span><textarea id="message" name="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder={t("Transfer, bebek yatağı veya özel istekleriniz…", "Transfers, a baby cot or any special requests…")} /></label>
        </fieldset>
        <details className={s.coupon}>
          <summary>{t("Bir indirim kodunuz var mı?", "Have a discount code?")}</summary>
          <div className={s.couponRow}>
            <label className={s.field}><span>{t("Kupon kodu", "Coupon code")}</span><input id="couponCode" disabled={isApplyingCoupon || isSubmitting} value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); resetCouponState(); }} placeholder={t("Kodunuzu girin", "Enter your code")} /></label>
            <button type="button" className={s.secondaryButton} onClick={handleApplyCoupon} disabled={isApplyingCoupon || isSubmitting}>{isApplyingCoupon ? t("Kontrol ediliyor…", "Checking…") : t("Kuponu uygula", "Apply coupon")}</button>
          </div>
          {couponMessage && <p role="status" className={s.notice} data-tone={appliedCoupon ? undefined : "error"} style={{ marginTop: 15 }}>{couponMessage}</p>}
        </details>
        <label className={s.consent}>
          <input type="checkbox" required checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} disabled={isSubmitting} />
          <span>{t("", "I have read and accept the ")}<Link href={href("/kullanim-kosullari")} target="_blank" rel="noopener noreferrer">{t("Rezervasyon ve Kullanım Koşulları", "Booking and Usage Terms")}</Link>{t(", ", ", ")}<Link href={href("/kvkk")} target="_blank" rel="noopener noreferrer">{t("KVKK Aydınlatma Metni", "Privacy Notice")}</Link>{t(" ve rezervasyon talebi için bilgilerimin işlenmesini okudum, kabul ediyorum.", " and consent to processing my information for this booking inquiry.")}</span>
        </label>
        {submitMessage && <div role={submitTone === "error" ? "alert" : "status"} className={s.notice} data-tone={submitTone === "error" ? "error" : undefined}>{submitMessage}{confirmationPath && <Link href={href(confirmationPath)} className={s.textLink}>{t("Talep durumunu görüntüle", "View inquiry status")}</Link>}</div>}
        <div className={s.submitTotal} aria-live="polite"><span>{pickLocalized(locale, "Konaklama toplamı", "Stay total")} · {pricing.nightCount} {pickLocalized(locale, "gece", "nights")}</span><strong>{formatCurrency(pricing.grandTotal, locale)}</strong></div>
        <div className={s.submitRow}>
          <button type="submit" disabled={isSubmitting || isApplyingCoupon} className={s.button}>{isSubmitting ? t("Gönderiliyor…", "Sending…") : t("Talebimi gönder", "Send my inquiry")}<SiteIcon name="arrow" /></button>
          <span className={s.note}>{t("Şimdi ödeme yapmanız gerekmez.", "No payment is required now.")}</span>
        </div>
      </form>
    </div>
    <aside className={s.bookingAside}>
      <RequestSummary villa={villa} checkIn={checkIn} checkOut={checkOut} pricing={pricing} guestCount={guestCount} locale={locale} />
      <div className={s.bookingHelp}><SiteIcon name="sun" /><div>{t("Tatil planınızda yanınızdayız.", "Here to help plan your stay.")}<Link href={href("/iletisim")}>{t("Bir sorum var", "I have a question")}</Link></div></div>
    </aside>
  </div>;
}
