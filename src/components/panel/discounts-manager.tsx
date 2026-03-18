"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPercent, type DemoDiscountCampaign } from "@/lib/demo-operations";
import { formatShortDate, type CatalogVilla } from "@/lib/villa-catalog";

type DiscountsManagerProps = {
  villas: CatalogVilla[];
  discounts: DemoDiscountCampaign[];
};

export function DiscountsManager({ villas, discounts }: DiscountsManagerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyDiscountId, setBusyDiscountId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [formState, setFormState] = useState({
    title: "",
    villaScope: "ALL",
    percentOff: "10",
    startDate: "",
    endDate: "",
    note: "",
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
      const response = await fetch("/api/demo/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          percentOff: Number(formState.percentOff),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Indirim kampanyasi eklenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Indirim kampanyasi kaydedildi. Vitrin fiyatlari guncellendi.");
      setFormState({
        title: "",
        villaScope: "ALL",
        percentOff: "10",
        startDate: "",
        endDate: "",
        note: "",
        active: true,
      });
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kampanya kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleCampaign(discount: DemoDiscountCampaign) {
    setBusyDiscountId(discount.id);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/discounts/${discount.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !discount.active,
          villaScope: discount.villaScope,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kampanya durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kampanya durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kampanya durumu guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyDiscountId(null);
    }
  }

  async function deleteCampaign(discount: DemoDiscountCampaign) {
    setBusyDiscountId(discount.id);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/discounts/${discount.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaScope: discount.villaScope,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kampanya silinemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Indirim kampanyasi silindi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kampanya silinirken baglanti hatasi olustu.");
    } finally {
      setBusyDiscountId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          Yeni Indirim
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900">
          Villa bazli veya tum site geneli kampanya olustur
        </h2>
        <p className="mt-4 text-sm leading-8 text-slate-600">
          Aktif ve tarih araligi uygun olan kampanyalar vitrinde otomatik eski fiyat ustu cizili
          sekilde gorunur.
        </p>

        <form onSubmit={handleCreate} className="mt-8 space-y-5">
          <div>
            <label htmlFor="discount-title" className="text-sm font-medium text-slate-700">
              Kampanya basligi
            </label>
            <input
              id="discount-title"
              value={formState.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Ornek: Yaz oncesi erken rezervasyon"
              className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="discount-villa" className="text-sm font-medium text-slate-700">
                Villa kapsami
              </label>
              <select
                id="discount-villa"
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
              <label htmlFor="discount-percent" className="text-sm font-medium text-slate-700">
                Indirim orani
              </label>
              <input
                id="discount-percent"
                type="number"
                min={1}
                max={99}
                value={formState.percentOff}
                onChange={(event) => setField("percentOff", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="discount-start" className="text-sm font-medium text-slate-700">
                Baslangic tarihi
              </label>
              <input
                id="discount-start"
                type="date"
                value={formState.startDate}
                onChange={(event) => setField("startDate", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="discount-end" className="text-sm font-medium text-slate-700">
                Bitis tarihi
              </label>
              <input
                id="discount-end"
                type="date"
                value={formState.endDate}
                onChange={(event) => setField("endDate", event.target.value)}
                className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="discount-note" className="text-sm font-medium text-slate-700">
              Not
            </label>
            <textarea
              id="discount-note"
              rows={4}
              value={formState.note}
              onChange={(event) => setField("note", event.target.value)}
              placeholder="Kampanyanin neden acildigini veya ekip icin kisa notu yaz."
              className="mt-2 w-full rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            />
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
            {isSubmitting ? "Kaydediliyor..." : "Kampanya Olustur"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {discounts.map((discount) => (
          <article
            key={discount.id}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      discount.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {discount.active ? "Aktif" : "Pasif"}
                  </span>
                  <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
                    {formatPercent(discount.percentOff)}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{discount.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {discount.villaScope === "ALL"
                    ? "Tum villalarda gecerli"
                    : villas.find((villa) => villa.slug === discount.villaScope)?.title ??
                      discount.villaScope}
                </p>
              </div>

              <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-4 py-4 text-sm text-slate-600">
                <p>
                  {formatShortDate(discount.startDate)} - {formatShortDate(discount.endDate)}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{discount.note || "Not girilmedi."}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busyDiscountId === discount.id}
                onClick={() => toggleCampaign(discount)}
                className="inline-flex rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                {discount.active ? "Pasife Al" : "Aktiflestir"}
              </button>
              <button
                type="button"
                disabled={busyDiscountId === discount.id}
                onClick={() => deleteCampaign(discount)}
                className="inline-flex rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Sil
              </button>
            </div>
          </article>
        ))}

        {discounts.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Henuz kampanya kaydi bulunmuyor.
          </div>
        ) : null}
      </section>
    </div>
  );
}
