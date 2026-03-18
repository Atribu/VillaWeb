"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency } from "@/lib/villa-catalog";

type PricingManagerProps = {
  villas: CatalogVilla[];
};

type VillaPricingFormState = {
  baseNightlyPrice: string;
  cleaningFee: string;
  minNightCount: string;
};

export function PricingManager({ villas }: PricingManagerProps) {
  const router = useRouter();
  const [savingVillaSlug, setSavingVillaSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [formState, setFormState] = useState<Record<string, VillaPricingFormState>>(() =>
    Object.fromEntries(
      villas.map((villa) => [
        villa.slug,
        {
          baseNightlyPrice: String(villa.nightlyPrice),
          cleaningFee: String(villa.cleaningFee ?? 0),
          minNightCount: String(villa.minNightCount ?? 1),
        },
      ]),
    ),
  );

  const sortedVillas = useMemo(
    () => [...villas].sort((left, right) => left.title.localeCompare(right.title)),
    [villas],
  );

  function updateField(villaSlug: string, field: keyof VillaPricingFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [villaSlug]: {
        ...current[villaSlug],
        [field]: value,
      },
    }));
  }

  async function handleSave(villaSlug: string) {
    setSavingVillaSlug(villaSlug);
    setMessage("");

    try {
      const response = await fetch("/api/demo/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaSlug,
          baseNightlyPrice: Number(formState[villaSlug]?.baseNightlyPrice ?? 0),
          cleaningFee: Number(formState[villaSlug]?.cleaningFee ?? 0),
          minNightCount: Number(formState[villaSlug]?.minNightCount ?? 1),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Fiyat kaydi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Fiyat kurallari basariyla kaydedildi. Public fiyatlar yenilendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Fiyat kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setSavingVillaSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-[1.4rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {sortedVillas.map((villa) => {
          const state = formState[villa.slug];

          return (
            <article
              key={villa.slug}
              className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                    {villa.locationLabel}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-900">{villa.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Public listede gorunen baz fiyat, minimum gece ve temizlik ucreti bu karttan
                    yonetilir.
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-4 py-4 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Canli Vitrin Fiyati
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">gecelik</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor={`${villa.slug}-nightly`} className="text-sm font-medium text-slate-700">
                    Gecelik baz fiyat
                  </label>
                  <input
                    id={`${villa.slug}-nightly`}
                    type="number"
                    min={1}
                    value={state?.baseNightlyPrice ?? ""}
                    onChange={(event) =>
                      updateField(villa.slug, "baseNightlyPrice", event.target.value)
                    }
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor={`${villa.slug}-cleaning`} className="text-sm font-medium text-slate-700">
                    Temizlik ucreti
                  </label>
                  <input
                    id={`${villa.slug}-cleaning`}
                    type="number"
                    min={0}
                    value={state?.cleaningFee ?? ""}
                    onChange={(event) => updateField(villa.slug, "cleaningFee", event.target.value)}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor={`${villa.slug}-min-night`} className="text-sm font-medium text-slate-700">
                    Minimum gece
                  </label>
                  <input
                    id={`${villa.slug}-min-night`}
                    type="number"
                    min={1}
                    value={state?.minNightCount ?? ""}
                    onChange={(event) => updateField(villa.slug, "minNightCount", event.target.value)}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {villa.activeDiscountTitle ? (
                  <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
                    Aktif kampanya: {villa.activeDiscountTitle}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Su anda aktif kampanya yok
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(villa.slug)}
                  disabled={savingVillaSlug === villa.slug}
                  className="ml-auto inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {savingVillaSlug === villa.slug ? "Kaydediliyor..." : "Fiyatlari Kaydet"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
