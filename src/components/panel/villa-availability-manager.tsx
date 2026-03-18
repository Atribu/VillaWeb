"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AvailabilityRange, CatalogVilla } from "@/lib/villa-catalog";
import { formatShortDate } from "@/lib/villa-catalog";

type VillaAvailabilityManagerProps = {
  villa: CatalogVilla;
};

const availabilityStatusOptions: Array<{
  value: AvailabilityRange["status"];
  label: string;
  description: string;
}> = [
  {
    value: "RESERVED",
    label: "Dolu / Rezervasyon",
    description: "Bu tarih araliginda villa satista gorunmez.",
  },
  {
    value: "MAINTENANCE",
    label: "Bakim",
    description: "Temizlik, onarim veya hazirlik icin kapali gunler.",
  },
  {
    value: "UNAVAILABLE",
    label: "Kapali",
    description: "Manuel kapama veya operasyona ozel blok kaydi.",
  },
];

function getAvailabilityTone(status: AvailabilityRange["status"]) {
  if (status === "RESERVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "MAINTENANCE") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getAvailabilityLabel(status: AvailabilityRange["status"]) {
  return availabilityStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getDefaultStartDate() {
  return new Date().toISOString().slice(0, 10);
}

export function VillaAvailabilityManager({ villa }: VillaAvailabilityManagerProps) {
  const router = useRouter();
  const [ranges, setRanges] = useState(villa.availabilityRanges);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRangeId, setDeletingRangeId] = useState<string | null>(null);
  const today = getDefaultStartDate();
  const [formState, setFormState] = useState({
    startDate: today,
    endDate: "",
    label: "",
    status: "RESERVED" as AvailabilityRange["status"],
  });

  function updateField<Key extends keyof typeof formState>(key: Key, value: (typeof formState)[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSuccess(nextRanges: AvailabilityRange[], nextMessage: string) {
    setRanges(nextRanges);
    setMessage(nextMessage);
    setMessageTone("success");
    router.refresh();
  }

  function handleError(nextMessage: string) {
    setMessage(nextMessage);
    setMessageTone("error");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!formState.startDate || !formState.endDate) {
      handleError("Baslangic ve bitis tarihi zorunludur.");
      return;
    }

    if (formState.endDate <= formState.startDate) {
      handleError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/demo/villas/${villa.slug}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as {
        error?: string;
        villa?: CatalogVilla;
      };

      if (!response.ok || !payload.villa) {
        handleError(payload.error ?? "Uygunluk kaydi eklenirken hata olustu.");
        return;
      }

      setFormState({
        startDate: getDefaultStartDate(),
        endDate: "",
        label: "",
        status: "RESERVED",
      });
      handleSuccess(payload.villa.availabilityRanges, "Yeni tarih bloku kaydedildi.");
    } catch {
      handleError("Baglanti hatasi nedeniyle kayit tamamlanamadi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(rangeId: string) {
    setMessage("");
    setDeletingRangeId(rangeId);

    try {
      const response = await fetch(`/api/demo/villas/${villa.slug}/availability`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rangeId }),
      });

      const payload = (await response.json()) as {
        error?: string;
        villa?: CatalogVilla;
      };

      if (!response.ok || !payload.villa) {
        handleError(payload.error ?? "Kayit silinirken hata olustu.");
        return;
      }

      handleSuccess(payload.villa.availabilityRanges, "Secilen tarih bloku silindi.");
    } catch {
      handleError("Silme islemi sirasinda baglanti hatasi olustu.");
    } finally {
      setDeletingRangeId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Yeni Tarih Bloku
        </p>
        <h3 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Secili villa icin dolu, bakim veya kapali tarih ekle
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Eklenen her tarih araligi sadece <span className="font-semibold">{villa.title}</span>{" "}
          icin gecerli olur. Sistem cakisan bloklara izin vermez.
        </p>

        <form onSubmit={handleCreate} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                Baslangic tarihi
              </label>
              <input
                id="startDate"
                type="date"
                value={formState.startDate}
                min={today}
                onChange={(event) => updateField("startDate", event.target.value)}
                className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                Bitis tarihi
              </label>
              <input
                id="endDate"
                type="date"
                min={formState.startDate || today}
                value={formState.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="text-sm font-medium text-slate-700">
              Durum
            </label>
            <select
              id="status"
              value={formState.status}
              onChange={(event) =>
                updateField("status", event.target.value as AvailabilityRange["status"])
              }
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            >
              {availabilityStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-soft-white)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-teal)]">
              Durum Aciklamalari
            </p>
            <div className="mt-3 space-y-2">
              {availabilityStatusOptions.map((option) => (
                <div key={option.value} className="rounded-[1.1rem] bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{option.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="label" className="text-sm font-medium text-slate-700">
              Panel notu
            </label>
            <input
              id="label"
              type="text"
              value={formState.label}
              placeholder="Ornek: 7 gecelik aile rezervasyonu"
              onChange={(event) => updateField("label", event.target.value)}
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
          </div>

          {message ? (
            <div
              className={`rounded-[1.25rem] border px-4 py-3 text-sm ${
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
            disabled={isSubmitting || deletingRangeId !== null}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-teal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Kaydediliyor..." : "Tarih Bloku Ekle"}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Mevcut Takvim Bloklari
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
              {ranges.length} adet tarih kaydi bu villaya bagli
            </h3>
          </div>
          <div className="rounded-full bg-[var(--color-soft-white)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Villa: {villa.district}, {villa.city}
          </div>
        </div>

        {ranges.length > 0 ? (
          <div className="mt-8 space-y-4">
            {ranges.map((range) => (
              <article
                key={range.id}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getAvailabilityTone(range.status)}`}
                    >
                      {getAvailabilityLabel(range.status)}
                    </div>
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      {formatShortDate(range.startDate)} - {formatShortDate(range.endDate)}
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{range.label}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || deletingRangeId !== null}
                    onClick={() => {
                      void handleDelete(range.id);
                    }}
                    className="inline-flex rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    {deletingRangeId === range.id ? "Siliniyor..." : "Bloku Sil"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm leading-7 text-slate-500">
            Bu villa icin henuz doluluk veya kapali tarih bloku eklenmedi. Yukaridaki formdan ilk
            kaydi olusturabilirsin.
          </div>
        )}
      </section>
    </div>
  );
}
