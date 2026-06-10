"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSyncModeLabel,
  type DemoChannelMappingRecord,
  type DemoSyncMode,
} from "@/lib/demo-calendar-sync";
import type { CatalogVilla } from "@/lib/villa-catalog";

type ChannelMappingsManagerProps = {
  mappings: DemoChannelMappingRecord[];
  villas: CatalogVilla[];
};

type MappingDraft = {
  remoteCalendarName: string;
  syncMode: DemoSyncMode;
};

const SYNC_MODES: DemoSyncMode[] = ["IMPORT_ONLY", "TWO_WAY"];

function buildDrafts(mappings: DemoChannelMappingRecord[]) {
  return Object.fromEntries(
    mappings.map((mapping) => [
      mapping.id,
      {
        remoteCalendarName: mapping.remoteCalendarName,
        syncMode: mapping.syncMode,
      } satisfies MappingDraft,
    ]),
  ) as Record<string, MappingDraft>;
}

export function ChannelMappingsManager({ mappings, villas }: ChannelMappingsManagerProps) {
  const router = useRouter();
  const [busyMappingId, setBusyMappingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, MappingDraft>>(buildDrafts(mappings));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [createForm, setCreateForm] = useState({
    villaId: villas[0]?.id ?? "",
    channelName: "",
    remoteCalendarName: "",
    syncMode: "IMPORT_ONLY" as DemoSyncMode,
  });

  async function updateMapping(
    mappingId: string,
    payload: {
      active?: boolean;
      syncMode?: DemoSyncMode;
      remoteCalendarName?: string;
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

  async function createMapping() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/calendar-sync/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kanal eslestirmesi olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yeni kanal eslestirmesi olusturuldu.");
      setCreateForm({
        villaId: villas[0]?.id ?? "",
        channelName: "",
        remoteCalendarName: "",
        syncMode: "IMPORT_ONLY",
      });
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kanal eslestirmesi olusturulurken baglanti hatasi olustu.");
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
              Yeni Kanal Eslestirmesi
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              Villa takvimini kanal ustundeki dogru takvim adi ile bagla
            </h3>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={createMapping}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Ekleniyor..." : "Eslestirmeyi Ekle"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={createForm.villaId}
            onChange={(event) => setCreateForm((current) => ({ ...current, villaId: event.target.value }))}
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            <option value="">Villa sec</option>
            {villas.map((villa) => (
              <option key={villa.id} value={villa.id}>
                {villa.title} · {villa.slug}
              </option>
            ))}
          </select>
          <input
            value={createForm.channelName}
            onChange={(event) => setCreateForm((current) => ({ ...current, channelName: event.target.value }))}
            placeholder="Kanal adi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.remoteCalendarName}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, remoteCalendarName: event.target.value }))
            }
            placeholder="Uzak takvim adi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <select
            value={createForm.syncMode}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                syncMode: event.target.value as DemoSyncMode,
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            {SYNC_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {getSyncModeLabel(mode)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="space-y-4">
        {mappings.map((mapping) => {
          const draft = drafts[mapping.id] ?? {
            remoteCalendarName: mapping.remoteCalendarName,
            syncMode: mapping.syncMode,
          };

          return (
            <article
              key={mapping.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4 xl:max-w-[44%]">
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
                    <p className="mt-2 text-sm text-slate-500">{mapping.channelName}</p>
                  </div>
                </div>

                <div className="grid w-full max-w-[420px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                  <input
                    value={draft.remoteCalendarName}
                    disabled={busyMappingId === mapping.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [mapping.id]: {
                          ...draft,
                          remoteCalendarName: event.target.value,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <select
                    value={draft.syncMode}
                    disabled={busyMappingId === mapping.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [mapping.id]: {
                          ...draft,
                          syncMode: event.target.value as DemoSyncMode,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {SYNC_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {getSyncModeLabel(mode)}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={busyMappingId === mapping.id}
                      onClick={() =>
                        updateMapping(mapping.id, {
                          remoteCalendarName: draft.remoteCalendarName,
                          syncMode: draft.syncMode,
                        })
                      }
                      className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyMappingId === mapping.id ? "Kaydediliyor..." : "Kaydet"}
                    </button>
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
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
