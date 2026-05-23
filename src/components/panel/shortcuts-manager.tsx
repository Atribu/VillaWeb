"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getShortcutStatusLabel,
  getShortcutStatusTone,
  type DemoShortcutRecord,
  type DemoShortcutStatus,
} from "@/lib/demo-external-links";
import { formatShortDate } from "@/lib/villa-catalog";

type ShortcutsManagerProps = {
  shortcuts: DemoShortcutRecord[];
};

const SHORTCUT_STATUSES: DemoShortcutStatus[] = ["ACTIVE", "HIDDEN"];

export function ShortcutsManager({ shortcuts }: ShortcutsManagerProps) {
  const router = useRouter();
  const [busyShortcutId, setBusyShortcutId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateStatus(shortcutId: string, status: DemoShortcutStatus) {
    setBusyShortcutId(shortcutId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/external-links/shortcuts/${shortcutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kisayol guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kisayol durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kisayol guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyShortcutId(null);
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
        {shortcuts.map((shortcut) => (
          <article
            key={shortcut.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getShortcutStatusTone(
                      shortcut.status,
                    )}`}
                  >
                    {getShortcutStatusLabel(shortcut.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {shortcut.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{shortcut.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{shortcut.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <a href={shortcut.url} className="font-semibold text-[#2b78ad] underline-offset-4 hover:underline">
                    {shortcut.url}
                  </a>
                  <span>{formatShortDate(shortcut.updatedAt.slice(0, 10))}</span>
                </div>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Durum
                </p>
                <select
                  value={shortcut.status}
                  disabled={busyShortcutId === shortcut.id}
                  onChange={(event) =>
                    updateStatus(shortcut.id, event.target.value as DemoShortcutStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {SHORTCUT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getShortcutStatusLabel(status)}
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
