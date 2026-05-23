"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPaymentMethodStatusLabel,
  getPaymentMethodStatusTone,
  type DemoPaymentMethodRecord,
  type DemoPaymentMethodStatus,
} from "@/lib/demo-settings";

type PaymentMethodsManagerProps = {
  methods: DemoPaymentMethodRecord[];
};

const METHOD_STATUSES: DemoPaymentMethodStatus[] = ["ACTIVE", "PASSIVE"];

export function PaymentMethodsManager({ methods }: PaymentMethodsManagerProps) {
  const router = useRouter();
  const [busyMethodId, setBusyMethodId] = useState<string | null>(null);
  const [draftFees, setDraftFees] = useState<Record<string, string>>(
    Object.fromEntries(methods.map((method) => [method.id, String(method.feePercent)])),
  );
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateMethod(
    methodId: string,
    payload: {
      status?: DemoPaymentMethodStatus;
      feePercent?: number;
    },
  ) {
    setBusyMethodId(methodId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/settings/payment-methods/${methodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Odeme yontemi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Odeme yontemi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Odeme yontemi guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyMethodId(null);
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
        {methods.map((method) => (
          <article
            key={method.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentMethodStatusTone(
                      method.status,
                    )}`}
                  >
                    {getPaymentMethodStatusLabel(method.status)}
                  </span>
                  {method.supportsInstallment ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Taksit destekler
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{method.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {method.provider} · {method.settlementDays} gun valör
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                  {method.note}
                </div>
              </div>

              <div className="grid w-full max-w-[340px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={draftFees[method.id] ?? String(method.feePercent)}
                  onChange={(event) =>
                    setDraftFees((current) => ({
                      ...current,
                      [method.id]: event.target.value,
                    }))
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                />
                <select
                  value={method.status}
                  disabled={busyMethodId === method.id}
                  onChange={(event) =>
                    updateMethod(method.id, { status: event.target.value as DemoPaymentMethodStatus })
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {METHOD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getPaymentMethodStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyMethodId === method.id}
                  onClick={() =>
                    updateMethod(method.id, {
                      feePercent: Number(draftFees[method.id] ?? method.feePercent),
                    })
                  }
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Komisyonu Kaydet
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
