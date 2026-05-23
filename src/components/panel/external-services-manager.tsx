"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getExternalServiceStatusLabel,
  getExternalServiceStatusTone,
  type DemoExternalServiceRecord,
  type DemoExternalServiceStatus,
} from "@/lib/demo-external-links";
import { formatShortDate } from "@/lib/villa-catalog";

type ExternalServicesManagerProps = {
  services: DemoExternalServiceRecord[];
};

const SERVICE_STATUSES: DemoExternalServiceStatus[] = ["ACTIVE", "WARNING", "OFFLINE"];

export function ExternalServicesManager({ services }: ExternalServicesManagerProps) {
  const router = useRouter();
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateStatus(serviceId: string, status: DemoExternalServiceStatus) {
    setBusyServiceId(serviceId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/external-links/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Dis servis guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Dis servis durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Dis servis guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyServiceId(null);
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
        {services.map((service) => (
          <article
            key={service.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getExternalServiceStatusTone(
                      service.status,
                    )}`}
                  >
                    {getExternalServiceStatusLabel(service.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {service.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{service.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {service.ownerLabel} · Son guncelleme {formatShortDate(service.updatedAt.slice(0, 10))}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                  {service.note}
                </div>

                <a href={service.url} className="inline-flex text-sm font-semibold text-[#2b78ad] underline-offset-4 hover:underline">
                  Dis servisi ac
                </a>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Servis Durumu
                </p>
                <select
                  value={service.status}
                  disabled={busyServiceId === service.id}
                  onChange={(event) =>
                    updateStatus(service.id, event.target.value as DemoExternalServiceStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {SERVICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getExternalServiceStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
