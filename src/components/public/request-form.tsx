"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import type { DemoCoupon, RequestPricingBreakdown } from "@/lib/demo-operations";

type RequestFormProps = {
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
  initialPricing: RequestPricingBreakdown;
  locale?: AppLocale;
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
}: RequestFormProps) {
  const router = useRouter();
  const localizedVilla = useMemo(() => getLocalizedVilla(villa, locale), [locale, villa]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(Math.min(2, villa.capacity));
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState(initialPricing.couponCode ?? "");
  const [pricing, setPricing] = useState(initialPricing);
  const [appliedCoupon, setAppliedCoupon] = useState<DemoCoupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitTone, setSubmitTone] = useState<"success" | "error">("success");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSummary = useMemo(
    () => [
      {
        label: pickLocalized(locale, "Ara toplam", "Subtotal"),
        value: formatCurrency(pricing.subtotal, locale),
      },
      {
        label: pricing.activeDiscountTitle
          ? `${pricing.activeDiscountTitle} (${pricing.activeDiscountPercent}%)`
          : pickLocalized(locale, "Kampanya", "Campaign"),
        value:
          pricing.activeDiscountTotal > 0
            ? `- ${formatCurrency(pricing.activeDiscountTotal, locale)}`
            : pickLocalized(locale, "Uygulanmadi", "Not applied"),
      },
      {
        label: pickLocalized(locale, "Temizlik ucreti", "Cleaning fee"),
        value: formatCurrency(pricing.cleaningFee, locale),
      },
      {
        label: pricing.couponTitle
          ? `${pricing.couponTitle} (${pricing.couponPercent}%)`
          : pickLocalized(locale, "Kupon indirimi", "Coupon discount"),
        value:
          pricing.couponDiscountTotal > 0
            ? `- ${formatCurrency(pricing.couponDiscountTotal, locale)}`
            : pickLocalized(locale, "Uygulanmadi", "Not applied"),
      },
    ],
    [locale, pricing],
  );

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
          couponCode: pricing.couponCode ?? couponCode,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        request?: {
          id: string;
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
      setSubmitMessage(
        pickLocalized(
          locale,
          `Talebin olusturuldu. Referans kodun: ${payload.request.id}. Panelde yeni talep olarak listeleniyor.`,
          `Your inquiry has been created. Reference code: ${payload.request.id}. It is now listed in the panel as a new inquiry.`,
        ),
      );
      setFullName("");
      setPhone("");
      setEmail("");
      setGuestCount(Math.min(2, localizedVilla.capacity));
      setMessage("");
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form
        onSubmit={handleSubmit}
        className="serene-card p-8"
      >
        <p className="serene-eyebrow">
          {pickLocalized(locale, "Talep Bilgileri", "Inquiry Details")}
        </p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
          {pickLocalized(locale, "Gecerli tarih secimi ile panelde islenebilir talep olustur", "Create a panel-ready inquiry with valid dates")}
        </h2>
        <p className="mt-4 text-sm leading-8 text-[var(--serene-on-surface-variant)]">
          {pickLocalized(
            locale,
            "Form tamamlandiginda kayit dogrudan paneldeki Talepler ekranina duser. Kupon kullanirsan toplam tutar burada ve panel kaydinda ayni sekilde gorunur.",
            "Once submitted, the record appears directly in the panel inquiries screen. If you use a coupon, the same total is shown here and in the panel record.",
          )}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Ad soyad", "Full name")}
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={pickLocalized(locale, "Ornek: Ayse Yilmaz", "Example: Emily Johnson")}
              className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="guestCount" className="text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Misafir sayisi", "Guest count")}
            </label>
            <input
              id="guestCount"
              type="number"
              min={1}
              max={villa.capacity}
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Telefon", "Phone")}
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+90 5xx xxx xx xx"
              className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "E-posta", "Email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@mail.com"
              className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="message" className="text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Ek not", "Additional note")}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder={pickLocalized(
                locale,
                "Transfer, cocuk yatagi, erken giris gibi taleplerini yazabilirsin.",
                "You can add notes such as transfer, baby cot or early check-in.",
              )}
              className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-8 rounded-[16px] border border-[var(--color-border-soft)] bg-[var(--serene-surface-low)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="couponCode" className="text-sm font-medium text-[var(--serene-on-surface)]">
                {pickLocalized(locale, "Kupon kodu", "Coupon code")}
              </label>
              <input
                id="couponCode"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  if (!event.target.value.trim()) {
                    resetCouponState();
                  }
                }}
                placeholder={pickLocalized(locale, "Ornek: YAZBASLIYOR10", "Example: SUMMERSTART10")}
                className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-white px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
              className="serene-button-primary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingCoupon
                ? pickLocalized(locale, "Kontrol ediliyor...", "Checking...")
                : pickLocalized(locale, "Kuponu Uygula", "Apply Coupon")}
            </button>
          </div>

          {couponMessage ? (
            <p
              className={`mt-4 text-sm leading-7 ${
                appliedCoupon ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {couponMessage}
            </p>
          ) : null}
        </div>

        {submitMessage ? (
          <div
            className={`mt-6 rounded-[1.4rem] border px-4 py-3 text-sm ${
              submitTone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {submitMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="serene-button-primary inline-flex px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? pickLocalized(locale, "Kaydediliyor...", "Saving...")
              : pickLocalized(locale, "Talebi Gonder", "Send Inquiry")}
          </button>
          <Link
            href={`/villalar/${villa.slug}`}
            className="serene-button-secondary inline-flex px-6 py-3 text-sm font-semibold"
          >
            {pickLocalized(locale, "Villa Detayina Don", "Back to Villa Details")}
          </Link>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="rounded-[16px] bg-ocean-panel p-8 text-white shadow-[0_20px_50px_rgba(26,54,93,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-tertiary-soft)]">
            {pickLocalized(locale, "Secim Ozeti", "Selection Summary")}
          </p>
          <h3 className="mt-4 text-3xl font-semibold leading-tight">{localizedVilla.title}</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>
              {pickLocalized(locale, "Giris", "Check-in")}: {formatShortDate(checkIn, locale)}
            </p>
            <p>
              {pickLocalized(locale, "Cikis", "Check-out")}: {formatShortDate(checkOut, locale)}
            </p>
            <p>
              {pickLocalized(locale, "Konaklama", "Stay")}: {pricing.nightCount}{" "}
              {pickLocalized(locale, "gece", "nights")}, {pickLocalized(locale, "minimum", "minimum")}{" "}
              {localizedVilla.minNightCount ?? 1} {pickLocalized(locale, "gece", "nights")}
            </p>
            <p>
              {pickLocalized(locale, "Kapasite", "Capacity")}: {pickLocalized(
                locale,
                `en fazla ${localizedVilla.capacity} misafir`,
                `up to ${localizedVilla.capacity} guests`,
              )}
            </p>
          </div>
        </div>

        <div className="serene-card p-8">
          <p className="serene-eyebrow">
            {pickLocalized(locale, "Fiyat Ozeti", "Price Summary")}
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{pickLocalized(locale, "Gecelik fiyat", "Nightly price")}</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(pricing.discountedNightlyPrice, locale)}
              </span>
            </div>

            {totalSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-base font-semibold text-slate-900">
                {pickLocalized(locale, "Toplam", "Total")}
              </span>
              <span className="text-2xl font-semibold text-slate-900">
                {formatCurrency(pricing.grandTotal, locale)}
              </span>
            </div>
          </div>
        </div>

        <div className="serene-card p-8">
          <p className="serene-eyebrow">
            {pickLocalized(locale, "Panel Etkisi", "Panel Effect")}
          </p>
          <p className="mt-4 text-sm leading-8 text-[var(--serene-on-surface-variant)]">
            {pickLocalized(
              locale,
              "Bu kayit admin panelindeki ",
              "This record appears in the admin panel ",
            )}
            <strong>{pickLocalized(locale, "Talepler", "Inquiries")}</strong>
            {pickLocalized(
              locale,
              " ekraninda durum degistirilebilir, raporlara yansir ve ilgili villanin ilgi metriklerini besler.",
              " screen, where its status can be updated, reflected in reports and used to feed the villa's interest metrics.",
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
