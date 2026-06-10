"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCalendarSourceStatusLabel,
  getCalendarSourceStatusTone,
  type DemoCalendarSourceStatus,
  type DemoIcalSourceRecord,
} from "@/lib/demo-calendar-sync";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatShortDate } from "@/lib/villa-catalog";

type CalendarSourcesManagerProps = {
  sources: DemoIcalSourceRecord[];
  villas: CatalogVilla[];
};

type SourceDraft = {
  sourceUrl: string;
  status: DemoCalendarSourceStatus;
};

const SOURCE_STATUSES: DemoCalendarSourceStatus[] = ["HEALTHY", "WARNING", "ERROR"];

function buildDrafts(sources: DemoIcalSourceRecord[]) {
  return Object.fromEntries(
    sources.map((source) => [
      source.id,
      {
        sourceUrl: source.sourceUrl,
        status: source.status,
      } satisfies SourceDraft,
    ]),
  ) as Record<string, SourceDraft>;
}

export function CalendarSourcesManager({ sources, villas }: CalendarSourcesManagerProps) {
  const router = useRouter();
  const [busySourceId, setBusySourceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SourceDraft>>(buildDrafts(sources));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [createForm, setCreateForm] = useState({
    villaId: villas[0]?.id ?? "",
    channelName: "",
    sourceUrl: "",
    direction: "IMPORT" as "IMPORT" | "EXPORT",
  });

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

  async function saveSourceSettings(sourceId: string, draft: SourceDraft) {
    setBusySourceId(sourceId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/calendar-sync/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kaynak ayarlari kaydedilemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kaynak ayarlari kaydedildi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kaynak ayarlari kaydedilirken baglanti hatasi olustu.");
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

  async function createSource() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/calendar-sync/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "iCal kaynagi olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yeni iCal kaynagi olusturuldu.");
      setCreateForm({
        villaId: villas[0]?.id ?? "",
        channelName: "",
        sourceUrl: "",
        direction: "IMPORT",
      });
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("iCal kaynagi olusturulurken baglanti hatasi olustu.");
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
              Yeni iCal Kaynagi
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              Kanal takvimini villa bazinda sisteme ekle ve senkron akisini baslat
            </h3>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={createSource}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Ekleniyor..." : "iCal Kaynagini Ekle"}
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
          <select
            value={createForm.direction}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                direction: event.target.value as "IMPORT" | "EXPORT",
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            <option value="IMPORT">Ice Aktarim</option>
            <option value="EXPORT">Disa Aktarim</option>
          </select>
        </div>

        <input
          value={createForm.sourceUrl}
          onChange={(event) => setCreateForm((current) => ({ ...current, sourceUrl: event.target.value }))}
          placeholder="https://ornek.com/channel.ics"
          className="mt-4 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
        />
      </section>

      <div className="space-y-4">
        {sources.map((source) => {
          const draft = drafts[source.id] ?? {
            sourceUrl: source.sourceUrl,
            status: source.status,
          };

          return (
            <article
              key={source.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4 xl:max-w-[44%]">
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
                    <p className="mt-2 text-sm text-slate-500">{source.channelName}</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                    Son senkron:{" "}
                    <span className="font-semibold text-slate-900">
                      {source.lastSyncedAt ? formatShortDate(source.lastSyncedAt.slice(0, 10)) : "-"}
                    </span>
                  </div>
                </div>

                <div className="grid w-full max-w-[420px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                  <input
                    value={draft.sourceUrl}
                    disabled={busySourceId === source.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [source.id]: { ...draft, sourceUrl: event.target.value },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />
                  <select
                    value={draft.status}
                    disabled={busySourceId === source.id}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [source.id]: {
                          ...draft,
                          status: event.target.value as DemoCalendarSourceStatus,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {SOURCE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getCalendarSourceStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={busySourceId === source.id}
                      onClick={() => saveSourceSettings(source.id, draft)}
                      className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busySourceId === source.id ? "Calisiyor..." : "Kaydet"}
                    </button>
                    <button
                      type="button"
                      disabled={busySourceId === source.id}
                      onClick={() => runSync(source.id)}
                      className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Manuel Senkron
                    </button>
                  </div>
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
          );
        })}
      </div>
    </div>
  );
}
