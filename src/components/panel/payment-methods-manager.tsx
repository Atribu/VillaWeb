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

type PaymentMethodDraft = {
  label: string;
  provider: string;
  feePercent: string;
  settlementDays: string;
  status: DemoPaymentMethodStatus;
  supportsInstallment: boolean;
  note: string;
};

const METHOD_STATUSES: DemoPaymentMethodStatus[] = ["ACTIVE", "PASSIVE"];

const INITIAL_CREATE_FORM: PaymentMethodDraft = {
  label: "",
  provider: "",
  feePercent: "0",
  settlementDays: "0",
  status: "ACTIVE",
  supportsInstallment: false,
  note: "",
};

function buildDrafts(methods: DemoPaymentMethodRecord[]) {
  return Object.fromEntries(
    methods.map((method) => [
      method.id,
      {
        label: method.label,
        provider: method.provider,
        feePercent: String(method.feePercent),
        settlementDays: String(method.settlementDays),
        status: method.status,
        supportsInstallment: method.supportsInstallment,
        note: method.note,
      } satisfies PaymentMethodDraft,
    ]),
  ) as Record<string, PaymentMethodDraft>;
}

export function PaymentMethodsManager({ methods }: PaymentMethodsManagerProps) {
  const router = useRouter();
  const [busyMethodId, setBusyMethodId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, PaymentMethodDraft>>(buildDrafts(methods));
  const [createForm, setCreateForm] = useState<PaymentMethodDraft>(INITIAL_CREATE_FORM);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateMethod(methodId: string, payload: Omit<PaymentMethodDraft, "feePercent" | "settlementDays"> & {
    feePercent: number;
    settlementDays: number;
  }) {
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

  async function createMethod() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/settings/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          feePercent: Number(createForm.feePercent),
          settlementDays: Number(createForm.settlementDays),
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Odeme yontemi olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yeni odeme yontemi eklendi.");
      setCreateForm(INITIAL_CREATE_FORM);
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Odeme yontemi olusturulurken baglanti hatasi olustu.");
    } finally {
      setIsCreating(false);
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

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
              Yeni Odeme Yontemi
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              Tahsilat kanalini, komisyonunu ve valör bilgisini panelden tanimla
            </h3>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={createMethod}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Ekleniyor..." : "Odeme Yontemini Ekle"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={createForm.label}
            onChange={(event) => setCreateForm((current) => ({ ...current, label: event.target.value }))}
            placeholder="Yontem etiketi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.provider}
            onChange={(event) => setCreateForm((current) => ({ ...current, provider: event.target.value }))}
            placeholder="Saglayici"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            type="number"
            min="0"
            step="0.1"
            value={createForm.feePercent}
            onChange={(event) => setCreateForm((current) => ({ ...current, feePercent: event.target.value }))}
            placeholder="Komisyon %"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={createForm.settlementDays}
            onChange={(event) => setCreateForm((current) => ({ ...current, settlementDays: event.target.value }))}
            placeholder="Valör gunu"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <select
            value={createForm.status}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                status: event.target.value as DemoPaymentMethodStatus,
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            {METHOD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getPaymentMethodStatusLabel(status)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={createForm.supportsInstallment}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  supportsInstallment: event.target.checked,
                }))
              }
            />
            Taksit destekler
          </label>
        </div>

        <textarea
          value={createForm.note}
          onChange={(event) => setCreateForm((current) => ({ ...current, note: event.target.value }))}
          placeholder="Kullanim notu"
          className="mt-4 min-h-[100px] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
        />
      </section>

      <div className="space-y-4">
        {methods.map((method) => {
          const draft = drafts[method.id] ?? {
            label: method.label,
            provider: method.provider,
            feePercent: String(method.feePercent),
            settlementDays: String(method.settlementDays),
            status: method.status,
            supportsInstallment: method.supportsInstallment,
            note: method.note,
          };

          return (
            <article
              key={method.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4 xl:max-w-[44%]">
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

                <div className="grid w-full max-w-[420px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                  <input
                    value={draft.label}
                    disabled={busyMethodId === method.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [method.id]: { ...draft, label: event.target.value },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <input
                    value={draft.provider}
                    disabled={busyMethodId === method.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [method.id]: { ...draft, provider: event.target.value },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={draft.feePercent}
                      disabled={busyMethodId === method.id}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [method.id]: { ...draft, feePercent: event.target.value },
                        }))
                      }
                      className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.settlementDays}
                      disabled={busyMethodId === method.id}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [method.id]: { ...draft, settlementDays: event.target.value },
                        }))
                      }
                      className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                    />
                  </div>
                  <select
                    value={draft.status}
                    disabled={busyMethodId === method.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [method.id]: {
                          ...draft,
                          status: event.target.value as DemoPaymentMethodStatus,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {METHOD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getPaymentMethodStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.supportsInstallment}
                      disabled={busyMethodId === method.id}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [method.id]: {
                            ...draft,
                            supportsInstallment: event.target.checked,
                          },
                        }))
                      }
                    />
                    Taksit destekler
                  </label>
                  <textarea
                    value={draft.note}
                    disabled={busyMethodId === method.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [method.id]: { ...draft, note: event.target.value },
                      }))
                    }
                    className="min-h-[96px] rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <button
                    type="button"
                    disabled={busyMethodId === method.id}
                    onClick={() =>
                      updateMethod(method.id, {
                        label: draft.label,
                        provider: draft.provider,
                        feePercent: Number(draft.feePercent),
                        settlementDays: Number(draft.settlementDays),
                        status: draft.status,
                        supportsInstallment: draft.supportsInstallment,
                        note: draft.note,
                      })
                    }
                    className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyMethodId === method.id ? "Kaydediliyor..." : "Odeme Yontemini Kaydet"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
