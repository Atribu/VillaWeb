"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogVilla } from "@/lib/villa-catalog";

type VillaStatusActionsProps = {
  slug: string;
  title: string;
  status: CatalogVilla["status"];
};

type ApiPayload = {
  error?: string;
};

async function readApiPayload(response: Response) {
  try {
    return (await response.json()) as ApiPayload;
  } catch {
    return {} satisfies ApiPayload;
  }
}

export function VillaStatusActions({ slug, title, status }: VillaStatusActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function updateStatus(nextStatus: CatalogVilla["status"], label: string) {
    setBusyAction(nextStatus);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/villas/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        setMessage(payload.error ?? "Villa durumu guncellenemedi.");
        return;
      }

      setMessage(`${title} ${label}.`);
      router.refresh();
    } catch {
      setMessage("Villa durumu guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteVilla() {
    const confirmed = window.confirm(
      `${title} kalici olarak silinecek. Bu islem geri alinamaz. Devam edelim mi?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyAction("DELETE");
    setMessage("");

    try {
      const response = await fetch(`/api/demo/villas/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        setMessage(payload.error ?? "Villa silinemedi.");
        return;
      }

      setMessage(`${title} silindi.`);
      router.refresh();
    } catch {
      setMessage("Villa silinirken baglanti hatasi olustu.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {status !== "ACTIVE" ? (
          <button
            type="button"
            onClick={() => updateStatus("ACTIVE", "aktif hale getirildi")}
            disabled={Boolean(busyAction)}
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "ACTIVE" ? "Aktif ediliyor..." : "Aktifleştir"}
          </button>
        ) : null}

        {status !== "PAUSED" ? (
          <button
            type="button"
            onClick={() => updateStatus("PAUSED", "pasife alindi")}
            disabled={Boolean(busyAction)}
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "PAUSED" ? "Pasife aliniyor..." : "Pasife Al"}
          </button>
        ) : null}

        {status !== "ARCHIVED" ? (
          <button
            type="button"
            onClick={() => updateStatus("ARCHIVED", "arsivlendi")}
            disabled={Boolean(busyAction)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "ARCHIVED" ? "Arsivleniyor..." : "Arşivle"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={deleteVilla}
          disabled={Boolean(busyAction)}
          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "DELETE" ? "Siliniyor..." : "Kalıcı Sil"}
        </button>
      </div>

      {message ? (
        <p className="rounded-[1rem] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
