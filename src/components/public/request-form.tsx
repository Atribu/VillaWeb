"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import type { DemoCoupon, RequestPricingBreakdown } from "@/lib/demo-operations";

type RequestFormProps = {
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
  initialPricing: RequestPricingBreakdown;
};

function getEmptyFieldErrorMessage() {
  return "Ad soyad, telefon ve e-posta bilgisi zorunludur.";
}

export function RequestForm({
  villa,
  checkIn,
  checkOut,
  initialPricing,
}: RequestFormProps) {
  const router = useRouter();
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
      { label: "Ara toplam", value: formatCurrency(pricing.subtotal) },
      {
        label: pricing.activeDiscountTitle
          ? `${pricing.activeDiscountTitle} (${pricing.activeDiscountPercent}%)`
          : "Kampanya",
        value:
          pricing.activeDiscountTotal > 0
            ? `- ${formatCurrency(pricing.activeDiscountTotal)}`
            : "Uygulanmadi",
      },
      {
        label: "Temizlik ucreti",
        value: formatCurrency(pricing.cleaningFee),
      },
      {
        label: pricing.couponTitle
          ? `${pricing.couponTitle} (${pricing.couponPercent}%)`
          : "Kupon indirimi",
        value:
          pricing.couponDiscountTotal > 0
            ? `- ${formatCurrency(pricing.couponDiscountTotal)}`
            : "Uygulanmadi",
      },
    ],
    [pricing],
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
        setCouponMessage(payload.error ?? "Kupon dogrulanamadi.");
        return;
      }

      setPricing(payload.pricing);
      setAppliedCoupon(payload.coupon ?? null);
      setCouponMessage(
        `${payload.coupon?.title ?? "Kupon"} basariyla uygulandi. Yeni toplam fiyat guncellendi.`,
      );
    } catch {
      setCouponMessage("Kupon kontrolu sirasinda baglanti hatasi olustu.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setSubmitTone("error");
      setSubmitMessage(getEmptyFieldErrorMessage());
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
        setSubmitMessage(payload.error ?? "Talep kaydi olusturulamadi.");
        return;
      }

      setSubmitTone("success");
      setSubmitMessage(
        `Talebin olusturuldu. Referans kodun: ${payload.request.id}. Panelde yeni talep olarak listeleniyor.`,
      );
      setFullName("");
      setPhone("");
      setEmail("");
      setGuestCount(Math.min(2, villa.capacity));
      setMessage("");
      setCouponCode("");
      setAppliedCoupon(null);
      setPricing(initialPricing);
      router.refresh();
    } catch {
      setSubmitTone("error");
      setSubmitMessage("Talep kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          Talep Bilgileri
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900">
          Gecerli tarih secimi ile panelde islenebilir talep olustur
        </h2>
        <p className="mt-4 text-sm leading-8 text-slate-600">
          Form tamamlandiginda kayit dogrudan paneldeki <strong>Talepler</strong> ekranina duser.
          Kupon kullanirsan toplam tutar burada ve panel kaydinda ayni sekilde gorunur.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              Ad soyad
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ornek: Ayse Yilmaz"
              className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="guestCount" className="text-sm font-medium text-slate-700">
              Misafir sayisi
            </label>
            <input
              id="guestCount"
              type="number"
              min={1}
              max={villa.capacity}
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-slate-700">
              Telefon
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+90 5xx xxx xx xx"
              className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@mail.com"
              className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="message" className="text-sm font-medium text-slate-700">
              Ek not
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Transfer, cocuk yatagi, erken giris gibi taleplerini yazabilirsin."
              className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-8 rounded-[1.6rem] border border-black/6 bg-[var(--color-slate-soft)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="couponCode" className="text-sm font-medium text-slate-700">
                Kupon kodu
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
                placeholder="Ornek: YAZBASLIYOR10"
                className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isApplyingCoupon ? "Kontrol ediliyor..." : "Kuponu Uygula"}
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
            className="inline-flex rounded-full bg-[var(--color-coral)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Kaydediliyor..." : "Talebi Gonder"}
          </button>
          <Link
            href={`/villalar/${villa.slug}`}
            className="inline-flex rounded-full border border-black/8 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Villa Detayina Don
          </Link>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
            Secim Ozeti
          </p>
          <h3 className="mt-4 text-3xl font-semibold leading-tight">{villa.title}</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>Giris: {formatShortDate(checkIn)}</p>
            <p>Cikis: {formatShortDate(checkOut)}</p>
            <p>
              Konaklama: {pricing.nightCount} gece, minimum {villa.minNightCount ?? 1} gece
            </p>
            <p>Kapasite: en fazla {villa.capacity} misafir</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Fiyat Ozeti
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Gecelik fiyat</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(pricing.discountedNightlyPrice)}
              </span>
            </div>

            {totalSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-base font-semibold text-slate-900">Toplam</span>
              <span className="text-2xl font-semibold text-slate-900">
                {formatCurrency(pricing.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Panel Etkisi
          </p>
          <p className="mt-4 text-sm leading-8 text-slate-600">
            Bu kayit admin panelindeki <strong>Talepler</strong> ekraninda durum degistirilebilir,
            raporlara yansir ve ilgili villanin ilgi metriklerini besler.
          </p>
        </div>
      </aside>
    </div>
  );
}
