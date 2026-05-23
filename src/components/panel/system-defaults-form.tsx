"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoSystemDefaults } from "@/lib/demo-settings";

type SystemDefaultsFormProps = {
  defaults: DemoSystemDefaults;
};

export function SystemDefaultsForm({ defaults }: SystemDefaultsFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    leadResponseMinutes: String(defaults.leadResponseMinutes),
    defaultMinNightCount: String(defaults.defaultMinNightCount),
    defaultCleaningLeadHours: String(defaults.defaultCleaningLeadHours),
    supportPhone: defaults.supportPhone,
    supportEmail: defaults.supportEmail,
    defaultCurrency: defaults.defaultCurrency,
    requestReminderHours: String(defaults.requestReminderHours),
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/settings/defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadResponseMinutes: Number(formState.leadResponseMinutes),
          defaultMinNightCount: Number(formState.defaultMinNightCount),
          defaultCleaningLeadHours: Number(formState.defaultCleaningLeadHours),
          supportPhone: formState.supportPhone,
          supportEmail: formState.supportEmail,
          defaultCurrency: formState.defaultCurrency,
          requestReminderHours: Number(formState.requestReminderHours),
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Sistem varsayilanlari guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Sistem varsayilanlari kaydedildi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kayit sirasinda baglanti hatasi olustu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["leadResponseMinutes", "Talep geri donus (dk)", "number"],
          ["defaultMinNightCount", "Varsayilan min gece", "number"],
          ["defaultCleaningLeadHours", "Temizlik hazirlik (saat)", "number"],
          ["supportPhone", "Destek telefonu", "text"],
          ["supportEmail", "Destek e-postasi", "email"],
          ["defaultCurrency", "Varsayilan para birimi", "text"],
          ["requestReminderHours", "Hatirlatma saati", "number"],
        ].map(([field, label, type]) => (
          <label key={field} className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {label}
            </span>
            <input
              type={type}
              value={formState[field as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [field]: event.target.value,
                }))
              }
              className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>
        ))}
      </div>

      {message ? (
        <div
          className={`mt-4 rounded-[1.2rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Kaydediliyor..." : "Varsayilanlari Kaydet"}
        </button>
      </div>
    </form>
  );
}
