"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSyncModeLabel,
  type DemoChannelMappingRecord,
  type DemoSyncMode,
} from "@/lib/demo-calendar-sync";

type ChannelMappingsManagerProps = {
  mappings: DemoChannelMappingRecord[];
};

const SYNC_MODES: DemoSyncMode[] = ["IMPORT_ONLY", "TWO_WAY"];

export function ChannelMappingsManager({ mappings }: ChannelMappingsManagerProps) {
  const router = useRouter();
  const [busyMappingId, setBusyMappingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateMapping(
    mappingId: string,
    payload: {
      active?: boolean;
      syncMode?: DemoSyncMode;
    },
  ) {
    setBusyMappingId(mappingId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/calendar-sync/mappings/${mappingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Eslestirme guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kanal eslestirmesi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Eslestirme guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyMappingId(null);
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
        {mappings.map((mapping) => (
          <article
            key={mapping.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      mapping.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {mapping.active ? "Aktif" : "Pasif"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getSyncModeLabel(mapping.syncMode)}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{mapping.villaTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {mapping.channelName} · {mapping.remoteCalendarName}
                  </p>
                </div>
              </div>

              <div className="grid w-full max-w-[320px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <select
                  value={mapping.syncMode}
                  disabled={busyMappingId === mapping.id}
                  onChange={(event) =>
                    updateMapping(mapping.id, { syncMode: event.target.value as DemoSyncMode })
                  }
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {SYNC_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {getSyncModeLabel(mode)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyMappingId === mapping.id}
                  onClick={() => updateMapping(mapping.id, { active: !mapping.active })}
                  className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mapping.active ? "Pasife Cek" : "Aktiflestir"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
