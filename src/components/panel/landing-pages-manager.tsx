"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getLandingStatusLabel,
  getLandingStatusTone,
  type DemoLandingPageRecord,
  type DemoLandingStatus,
} from "@/lib/demo-websites";
import { formatShortDate } from "@/lib/villa-catalog";

type LandingPagesManagerProps = {
  landings: DemoLandingPageRecord[];
};

const LANDING_STATUSES: DemoLandingStatus[] = ["LIVE", "DRAFT", "REVISION"];

export function LandingPagesManager({ landings }: LandingPagesManagerProps) {
  const router = useRouter();
  const [busyLandingId, setBusyLandingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateLanding(landingId: string, status: DemoLandingStatus) {
    setBusyLandingId(landingId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/websites/landings/${landingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Landing guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Landing durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Landing guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyLandingId(null);
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
        {landings.map((landing) => (
          <article
            key={landing.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getLandingStatusTone(
                      landing.status,
                    )}`}
                  >
                    {getLandingStatusLabel(landing.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {landing.targetRegion}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{landing.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    /{landing.slug} · {landing.focusKeyword}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                  Lead: <span className="font-semibold text-slate-900">{landing.leadCount}</span> · Son
                  guncelleme{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(landing.updatedAt.slice(0, 10))}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Durum
                </p>
                <select
                  value={landing.status}
                  disabled={busyLandingId === landing.id}
                  onChange={(event) =>
                    updateLanding(landing.id, event.target.value as DemoLandingStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {LANDING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getLandingStatusLabel(status)}
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
