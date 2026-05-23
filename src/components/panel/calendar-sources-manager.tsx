"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCalendarSourceStatusLabel,
  getCalendarSourceStatusTone,
  type DemoIcalSourceRecord,
} from "@/lib/demo-calendar-sync";
import { formatShortDate } from "@/lib/villa-catalog";

type CalendarSourcesManagerProps = {
  sources: DemoIcalSourceRecord[];
};

export function CalendarSourcesManager({ sources }: CalendarSourcesManagerProps) {
  const router = useRouter();
  const [busySourceId, setBusySourceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function toggleSource(sourceId: string, active: boolean) {
    setBusySourceId(sourceId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/calendar-sync/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kaynak guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kaynak durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kaynak guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusySourceId(null);
    }
  }

  async function runSync(sourceId: string) {
    setBusySourceId(sourceId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/calendar-sync/sources/${sourceId}/sync`, {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Senkron baslatilamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Manuel senkron baslatildi ve log kaydi olusturuldu.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Senkron sirasinda baglanti hatasi olustu.");
    } finally {
      setBusySourceId(null);
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
        {sources.map((source) => (
          <article
            key={source.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCalendarSourceStatusTone(
                      source.status,
                    )}`}
                  >
                    {getCalendarSourceStatusLabel(source.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {source.direction === "IMPORT" ? "Ice Aktarim" : "Disa Aktarim"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      source.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {source.active ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{source.villaTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {source.channelName} · {source.sourceUrl}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                  Son senkron:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(source.lastSyncedAt.slice(0, 10))}
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-[320px] gap-3 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <button
                  type="button"
                  disabled={busySourceId === source.id}
                  onClick={() => runSync(source.id)}
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busySourceId === source.id ? "Calisiyor..." : "Manuel Senkron Baslat"}
                </button>
                <button
                  type="button"
                  disabled={busySourceId === source.id}
                  onClick={() => toggleSource(source.id, !source.active)}
                  className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {source.active ? "Pasife Cek" : "Aktiflestir"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
