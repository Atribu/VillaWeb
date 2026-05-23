"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCommissionScopeLabel,
  type DemoCommissionRateRecord,
} from "@/lib/demo-users-messages";

type CommissionRatesManagerProps = {
  commissions: DemoCommissionRateRecord[];
};

export function CommissionRatesManager({ commissions }: CommissionRatesManagerProps) {
  const router = useRouter();
  const [busyCommissionId, setBusyCommissionId] = useState<string | null>(null);
  const [draftPercents, setDraftPercents] = useState<Record<string, string>>(
    Object.fromEntries(commissions.map((commission) => [commission.id, String(commission.percent)])),
  );
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateCommission(
    commissionId: string,
    payload: {
      active?: boolean;
      percent?: number;
    },
  ) {
    setBusyCommissionId(commissionId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Komisyon guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Komisyon kaydi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Komisyon guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyCommissionId(null);
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
        {commissions.map((commission) => (
          <article
            key={commission.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      commission.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {commission.active ? "Aktif" : "Pasif"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getCommissionScopeLabel(commission.scopeType)}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{commission.scopeLabel}</h3>
                  <p className="mt-2 text-sm text-slate-500">{commission.payoutRule}</p>
                </div>
              </div>

              <div className="grid w-full max-w-[340px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Komisyon Orani
                  </span>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      step="0.1"
                      value={draftPercents[commission.id] ?? String(commission.percent)}
                      onChange={(event) =>
                        setDraftPercents((current) => ({
                          ...current,
                          [commission.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                    />
                    <button
                      type="button"
                      disabled={busyCommissionId === commission.id}
                      onClick={() =>
                        updateCommission(commission.id, {
                          percent: Number(draftPercents[commission.id] ?? commission.percent),
                        })
                      }
                      className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Kaydet
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  disabled={busyCommissionId === commission.id}
                  onClick={() =>
                    updateCommission(commission.id, {
                      active: !commission.active,
                    })
                  }
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {commission.active ? "Pasife Cek" : "Aktiflestir"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
