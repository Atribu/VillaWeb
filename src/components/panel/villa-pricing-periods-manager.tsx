"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogVilla, VillaPricingPeriod } from "@/lib/villa-catalog";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type VillaPricingPeriodsManagerProps = {
  villa: CatalogVilla;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function VillaPricingPeriodsManager({ villa }: VillaPricingPeriodsManagerProps) {
  const router = useRouter();
  const [periods, setPeriods] = useState<VillaPricingPeriod[]>(villa.pricingPeriods ?? []);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [formState, setFormState] = useState({
    title: "",
    startDate: getToday(),
    endDate: "",
    nightlyPrice: String(villa.nightlyPrice),
    cleaningFee: "",
    minNightCount: "",
  });

  function updateField(key: keyof typeof formState, value: string) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function showError(value: string) {
    setMessageTone("error");
    setMessage(value);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/demo/villas/${villa.slug}/pricing-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          active,
          title: formState.title,
          startDate: formState.startDate,
          endDate: formState.endDate,
          nightlyPrice: Number(formState.nightlyPrice),
          cleaningFee: formState.cleaningFee ? Number(formState.cleaningFee) : null,
          minNightCount: formState.minNightCount ? Number(formState.minNightCount) : null,
        }),
      });
      const payload = (await response.json()) as { error?: string; villa?: CatalogVilla };

      if (!response.ok || !payload.villa) {
        showError(payload.error ?? "Fiyat donemi kaydedilemedi.");
        return;
      }

      setPeriods(payload.villa.pricingPeriods ?? []);
      setEditingId(null);
      setActive(true);
      setFormState({
        title: "",
        startDate: getToday(),
        endDate: "",
        nightlyPrice: String(villa.nightlyPrice),
        cleaningFee: "",
        minNightCount: "",
      });
      setMessageTone("success");
      setMessage(active ? "Fiyat donemi kaydedildi ve fiyatlamaya dahil edildi." : "Fiyat donemi pasif olarak kaydedildi.");
      router.refresh();
    } catch {
      showError("Baglanti hatasi nedeniyle fiyat donemi kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(pricingPeriodId: string) {
    if (!window.confirm("Bu fiyat donemi silinsin mi? Bu tarihlerde baz fiyat kullanilacak.")) return;
    setDeletingId(pricingPeriodId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/villas/${villa.slug}/pricing-periods`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricingPeriodId }),
      });
      const payload = (await response.json()) as { error?: string; villa?: CatalogVilla };

      if (!response.ok || !payload.villa) {
        showError(payload.error ?? "Fiyat donemi silinemedi.");
        return;
      }

      setPeriods(payload.villa.pricingPeriods ?? []);
      if (editingId === pricingPeriodId) setEditingId(null);
      setMessageTone("success");
      setMessage("Fiyat donemi silindi.");
      router.refresh();
    } catch {
      showError("Baglanti hatasi nedeniyle fiyat donemi silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
        Donemsel Fiyatlar
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
        Fiyat donemleri
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
        Yaz sezonu, bayram veya ozel donemler icin farkli fiyat ve minimum gece belirleyebilirsin.
        Ayni tarihlerde iki aktif donem olusturulamaz.
      </p>

      {message ? (
        <div
          className={`mt-6 rounded-[1.25rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="mt-7 grid gap-4 lg:grid-cols-3" id="pricing-period-form">
        <div className="lg:col-span-3">
          <label htmlFor="pricing-title" className="text-sm font-medium text-slate-700">
            Donem adi
          </label>
          <input
            id="pricing-title"
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Orn: Temmuz Yuksek Sezon"
            required
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="pricing-start" className="text-sm font-medium text-slate-700">
            Baslangic
          </label>
          <input
            id="pricing-start"
            type="date"
            value={formState.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
            required
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="pricing-end" className="text-sm font-medium text-slate-700">
            Bitis
          </label>
          <input
            id="pricing-end"
            type="date"
            min={formState.startDate}
            value={formState.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
            required
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="pricing-nightly" className="text-sm font-medium text-slate-700">
            Gecelik fiyat
          </label>
          <input
            id="pricing-nightly"
            type="number"
            min="1"
            step="0.01"
            value={formState.nightlyPrice}
            onChange={(event) => updateField("nightlyPrice", event.target.value)}
            required
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="pricing-cleaning" className="text-sm font-medium text-slate-700">
            Temizlik ucreti (opsiyonel)
          </label>
          <input
            id="pricing-cleaning"
            type="number"
            min="0"
            step="0.01"
            value={formState.cleaningFee}
            onChange={(event) => updateField("cleaningFee", event.target.value)}
            placeholder={String(villa.cleaningFee ?? 0)}
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="pricing-min-night" className="text-sm font-medium text-slate-700">
            Minimum gece (opsiyonel)
          </label>
          <input
            id="pricing-min-night"
            type="number"
            min="1"
            value={formState.minNightCount}
            onChange={(event) => updateField("minNightCount", event.target.value)}
            placeholder={String(villa.minNightCount ?? 1)}
            className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Donem aktif</label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--color-teal)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Kaydediliyor..." : editingId ? "Donemi Guncelle" : "Fiyat Donemi Ekle"}
          </button>
          {editingId ? <button type="button" className="panel-button-secondary" onClick={() => {
            setEditingId(null); setActive(true); setFormState({ title: "", startDate: getToday(), endDate: "", nightlyPrice: String(villa.nightlyPrice), cleaningFee: "", minNightCount: "" });
          }}>Duzenlemeden vazgec</button> : null}
        </div>
      </form>

      <div className="mt-8 grid gap-3">
        {periods.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
            Henuz donemsel fiyat tanimlanmadi. Secilen tarihlerde baz fiyat kullanilir.
          </div>
        ) : (
          periods.map((period) => (
            <article
              key={period.id}
              className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{period.title} <span className={`ml-2 text-xs ${period.active ? "text-emerald-700" : "text-slate-400"}`}>{period.active ? "Aktif" : "Pasif"}</span></p>
                <p className="mt-2 text-sm text-slate-500">
                  {formatShortDate(period.startDate)} - {formatShortDate(period.endDate)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700">
                  {formatCurrency(period.nightlyPrice)} / gece
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-slate-600">
                  Min. {period.minNightCount ?? villa.minNightCount ?? 1} gece
                </span>
                <button type="button" className="panel-button-secondary" disabled={isSubmitting || !!deletingId} onClick={() => {
                  setEditingId(period.id); setActive(period.active); setMessage("");
                  setFormState({ title: period.title, startDate: period.startDate, endDate: period.endDate,
                    nightlyPrice: String(period.nightlyPrice), cleaningFee: period.cleaningFee === undefined ? "" : String(period.cleaningFee),
                    minNightCount: period.minNightCount === undefined ? "" : String(period.minNightCount) });
                  document.getElementById("pricing-period-form")?.scrollIntoView({ block: "center", behavior: "smooth" });
                  document.getElementById("pricing-title")?.focus({ preventScroll: true });
                }}>Duzenle</button>
                <button
                  type="button"
                  onClick={() => handleDelete(period.id)}
                  disabled={deletingId === period.id}
                  className="rounded-full border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === period.id ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
