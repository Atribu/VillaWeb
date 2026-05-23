"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCacheGroupStatusLabel,
  getCacheGroupStatusTone,
  type DemoCacheGroupRecord,
  type DemoCacheGroupStatus,
} from "@/lib/demo-settings";
import { formatShortDate } from "@/lib/villa-catalog";

type CacheGroupsManagerProps = {
  groups: DemoCacheGroupRecord[];
};

const CACHE_STATUSES: DemoCacheGroupStatus[] = ["HEALTHY", "WARMING", "STALE"];

export function CacheGroupsManager({ groups }: CacheGroupsManagerProps) {
  const router = useRouter();
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateGroup(
    groupId: string,
    payload: {
      status?: DemoCacheGroupStatus;
      warmNow?: boolean;
    },
  ) {
    setBusyGroupId(groupId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/settings/cache-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Cache grubu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage(payload.warmNow ? "Cache warm islemi tamamlandi." : "Cache durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Cache guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyGroupId(null);
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
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCacheGroupStatusTone(
                      group.status,
                    )}`}
                  >
                    {getCacheGroupStatusLabel(group.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {group.target}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{group.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    TTL {group.ttlMinutes} dk · Warm araligi {group.warmIntervalMinutes} dk
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                  {group.note}
                  <div className="mt-3 text-slate-500">
                    Son warm:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatShortDate(group.lastWarmedAt.slice(0, 10))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid w-full max-w-[320px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <select
                  value={group.status}
                  disabled={busyGroupId === group.id}
                  onChange={(event) =>
                    updateGroup(group.id, { status: event.target.value as DemoCacheGroupStatus })
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {CACHE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getCacheGroupStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyGroupId === group.id}
                  onClick={() => updateGroup(group.id, { warmNow: true })}
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cache Warm Calistir
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
