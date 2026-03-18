"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPercent, normalizeCouponCode, type DemoCoupon } from "@/lib/demo-operations";
import { formatShortDate, type CatalogVilla } from "@/lib/villa-catalog";

type CouponsManagerProps = {
  villas: CatalogVilla[];
  coupons: DemoCoupon[];
};

export function CouponsManager({ villas, coupons }: CouponsManagerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [formState, setFormState] = useState({
    title: "",
    code: "",
    villaScope: "ALL",
    percentOff: "10",
    startDate: "",
    endDate: "",
    usageLimit: "20",
    active: true,
  });

  function setField<Key extends keyof typeof formState>(key: Key, value: (typeof formState)[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          code: normalizeCouponCode(formState.code),
          percentOff: Number(formState.percentOff),
          usageLimit: Number(formState.usageLimit),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kupon kaydi eklenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kupon kodu kaydedildi ve public talep formunda kullanilabilir hale geldi.");
      setFormState({
        title: "",
        code: "",
        villaScope: "ALL",
        percentOff: "10",
        startDate: "",
        endDate: "",
        usageLimit: "20",
        active: true,
      });
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kupon kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleCoupon(coupon: DemoCoupon) {
    setBusyCouponId(coupon.id);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !coupon.active,
          villaScope: coupon.villaScope,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kupon durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kupon durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kupon durumu guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyCouponId(null);
    }
  }

  async function deleteCoupon(coupon: DemoCoupon) {
    setBusyCouponId(coupon.id);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/coupons/${coupon.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaScope: coupon.villaScope,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kupon silinemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kupon kodu silindi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kupon silinirken baglanti hatasi olustu.");
    } finally {
      setBusyCouponId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          Yeni Kupon
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900">
          Kod, oran ve kullanim limitiyle calisan kupon yapisi
        </h2>
        <p className="mt-4 text-sm leading-8 text-slate-600">
          Burada eklenen aktif kuponlar public taraftaki talep formunda denenebilir ve kullanim
          sayisi raporlara otomatik yansir.
        </p>

        <form onSubmit={handleCreate} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="coupon-title" className="text-sm font-medium text-slate-700">
                Kupon basligi
              </label>
              <input
                id="coupon-title"
                value={formState.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Ornek: Acilis kampanyasi"
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="coupon-code" className="text-sm font-medium text-slate-700">
                Kupon kodu
              </label>
              <input
                id="coupon-code"
                value={formState.code}
                onChange={(event) => setField("code", normalizeCouponCode(event.target.value))}
                placeholder="YAZBASLIYOR10"
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="coupon-villa" className="text-sm font-medium text-slate-700">
                Villa kapsami
              </label>
              <select
                id="coupon-villa"
                value={formState.villaScope}
                onChange={(event) => setField("villaScope", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              >
                <option value="ALL">Tum villalar</option>
                {villas.map((villa) => (
                  <option key={villa.slug} value={villa.slug}>
                    {villa.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="coupon-percent" className="text-sm font-medium text-slate-700">
                Indirim orani
              </label>
              <input
                id="coupon-percent"
                type="number"
                min={1}
                max={99}
                value={formState.percentOff}
                onChange={(event) => setField("percentOff", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="coupon-limit" className="text-sm font-medium text-slate-700">
                Kullanim limiti
              </label>
              <input
                id="coupon-limit"
                type="number"
                min={1}
                value={formState.usageLimit}
                onChange={(event) => setField("usageLimit", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="coupon-start" className="text-sm font-medium text-slate-700">
                Baslangic tarihi
              </label>
              <input
                id="coupon-start"
                type="date"
                value={formState.startDate}
                onChange={(event) => setField("startDate", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="coupon-end" className="text-sm font-medium text-slate-700">
                Bitis tarihi
              </label>
              <input
                id="coupon-end"
                type="date"
                value={formState.endDate}
                onChange={(event) => setField("endDate", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.active}
              onChange={(event) => setField("active", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Kayit edilir edilmez aktif olsun
          </label>

          {message ? (
            <div
              className={`rounded-[1.3rem] border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kupon Olustur"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {coupons.map((coupon) => (
          <article
            key={coupon.id}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      coupon.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {coupon.active ? "Aktif" : "Pasif"}
                  </span>
                  <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
                    {coupon.code}
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{coupon.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {coupon.villaScope === "ALL"
                    ? "Tum villalarda gecerli"
                    : villas.find((villa) => villa.slug === coupon.villaScope)?.title ??
                      coupon.villaScope}
                </p>
              </div>

              <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-4 py-4 text-right">
                <p className="text-sm font-semibold text-slate-900">{formatPercent(coupon.percentOff)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {coupon.usageCount}/{coupon.usageLimit} kullanim
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.25rem] bg-[var(--color-slate-soft)] px-4 py-4 text-sm text-slate-600">
                {formatShortDate(coupon.startDate)} - {formatShortDate(coupon.endDate)}
              </div>
              <div className="rounded-[1.25rem] bg-[var(--color-slate-soft)] px-4 py-4 text-sm text-slate-600">
                Public formda kod girildiginde otomatik kontrol edilir.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busyCouponId === coupon.id}
                onClick={() => toggleCoupon(coupon)}
                className="inline-flex rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                {coupon.active ? "Pasife Al" : "Aktiflestir"}
              </button>
              <button
                type="button"
                disabled={busyCouponId === coupon.id}
                onClick={() => deleteCoupon(coupon)}
                className="inline-flex rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Sil
              </button>
            </div>
          </article>
        ))}

        {coupons.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Henuz kupon kaydi bulunmuyor.
          </div>
        ) : null}
      </section>
    </div>
  );
}
