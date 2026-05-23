"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrencyRateStatusLabel,
  getCurrencyRateStatusTone,
  type DemoCurrencyRateRecord,
  type DemoCurrencyRateStatus,
} from "@/lib/demo-settings";
import { formatShortDate } from "@/lib/villa-catalog";

type CurrencyRatesManagerProps = {
  currencies: DemoCurrencyRateRecord[];
};

const RATE_STATUSES: DemoCurrencyRateStatus[] = ["LIVE", "MANUAL", "STALE"];

export function CurrencyRatesManager({ currencies }: CurrencyRatesManagerProps) {
  const router = useRouter();
  const [busyCurrencyId, setBusyCurrencyId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, { buy: string; sell: string }>>(
    Object.fromEntries(
      currencies.map((currency) => [
        currency.id,
        { buy: String(currency.buyRate), sell: String(currency.sellRate) },
      ]),
    ),
  );
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateCurrency(
    currencyId: string,
    payload: {
      buyRate?: number;
      sellRate?: number;
      status?: DemoCurrencyRateStatus;
    },
  ) {
    setBusyCurrencyId(currencyId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/settings/currencies/${currencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kur guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kur bilgisi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kur guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyCurrencyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-[1.2rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        {currencies.map((currency) => (
          <article
            key={currency.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCurrencyRateStatusTone(
                      currency.status,
                    )}`}
                  >
                    {getCurrencyRateStatusLabel(currency.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {currency.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{currency.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">{currency.sourceLabel}</p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                  Son guncelleme:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(currency.updatedAt.slice(0, 10))}
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-[360px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    step="0.01"
                    value={draftValues[currency.id]?.buy ?? String(currency.buyRate)}
                    onChange={(event) =>
                      setDraftValues((current) => ({
                        ...current,
                        [currency.id]: {
                          ...current[currency.id],
                          buy: event.target.value,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={draftValues[currency.id]?.sell ?? String(currency.sellRate)}
                    onChange={(event) =>
                      setDraftValues((current) => ({
                        ...current,
                        [currency.id]: {
                          ...current[currency.id],
                          sell: event.target.value,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                </div>

                <select
                  value={currency.status}
                  disabled={busyCurrencyId === currency.id}
                  onChange={(event) =>
                    updateCurrency(currency.id, { status: event.target.value as DemoCurrencyRateStatus })
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {RATE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getCurrencyRateStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={busyCurrencyId === currency.id}
                  onClick={() =>
                    updateCurrency(currency.id, {
                      buyRate: Number(draftValues[currency.id]?.buy ?? currency.buyRate),
                      sellRate: Number(draftValues[currency.id]?.sell ?? currency.sellRate),
                    })
                  }
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
