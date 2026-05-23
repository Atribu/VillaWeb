"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWebsiteStatusLabel,
  getWebsiteStatusTone,
  type DemoWebsiteRecord,
  type DemoWebsiteStatus,
} from "@/lib/demo-websites";
import { formatShortDate } from "@/lib/villa-catalog";

type WebsitesManagerProps = {
  websites: DemoWebsiteRecord[];
};

const WEBSITE_STATUSES: DemoWebsiteStatus[] = ["LIVE", "STAGING", "PAUSED"];

export function WebsitesManager({ websites }: WebsitesManagerProps) {
  const router = useRouter();
  const [busyWebsiteId, setBusyWebsiteId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateWebsite(
    websiteId: string,
    payload: {
      status?: DemoWebsiteStatus;
      default?: boolean;
    },
  ) {
    setBusyWebsiteId(websiteId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/websites/sites/${websiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Site kaydi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Site ayari guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Site guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyWebsiteId(null);
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
        {websites.map((website) => (
          <article
            key={website.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getWebsiteStatusTone(
                      website.status,
                    )}`}
                  >
                    {getWebsiteStatusLabel(website.status)}
                  </span>
                  {website.default ? (
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                      Varsayilan
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{website.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {website.domain} · {website.locale} · {website.primaryChannel}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                  Son guncelleme:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(website.updatedAt.slice(0, 10))}
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-[320px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <select
                  value={website.status}
                  disabled={busyWebsiteId === website.id}
                  onChange={(event) =>
                    updateWebsite(website.id, { status: event.target.value as DemoWebsiteStatus })
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {WEBSITE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getWebsiteStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyWebsiteId === website.id || website.default}
                  onClick={() => updateWebsite(website.id, { default: true })}
                  className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Varsayilan Yap
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
