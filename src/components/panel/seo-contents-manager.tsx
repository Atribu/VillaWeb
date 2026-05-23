"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSeoContentStatusLabel,
  getSeoContentStatusTone,
  type DemoSeoContentRecord,
  type DemoSeoContentStatus,
} from "@/lib/demo-websites";
import { formatShortDate } from "@/lib/villa-catalog";

type SeoContentsManagerProps = {
  contents: DemoSeoContentRecord[];
};

const SEO_STATUSES: DemoSeoContentStatus[] = ["PLANNED", "IN_PROGRESS", "PUBLISHED"];

export function SeoContentsManager({ contents }: SeoContentsManagerProps) {
  const router = useRouter();
  const [busyContentId, setBusyContentId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, string>>(
    Object.fromEntries(contents.map((item) => [item.id, String(item.seoScore)])),
  );
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateContent(
    contentId: string,
    payload: {
      status?: DemoSeoContentStatus;
      seoScore?: number;
    },
  ) {
    setBusyContentId(contentId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/websites/seo-content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "SEO icerigi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("SEO icerigi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("SEO icerigi guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyContentId(null);
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
        {contents.map((content) => (
          <article
            key={content.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getSeoContentStatusTone(
                      content.status,
                    )}`}
                  >
                    {getSeoContentStatusLabel(content.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {content.contentType}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{content.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {content.primaryKeyword} · {content.targetUrl}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                  Son guncelleme{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(content.updatedAt.slice(0, 10))}
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-[340px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draftScores[content.id] ?? String(content.seoScore)}
                  onChange={(event) =>
                    setDraftScores((current) => ({
                      ...current,
                      [content.id]: event.target.value,
                    }))
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                />
                <select
                  value={content.status}
                  disabled={busyContentId === content.id}
                  onChange={(event) =>
                    updateContent(content.id, { status: event.target.value as DemoSeoContentStatus })
                  }
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {SEO_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getSeoContentStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyContentId === content.id}
                  onClick={() =>
                    updateContent(content.id, {
                      seoScore: Number(draftScores[content.id] ?? content.seoScore),
                    })
                  }
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  SEO Skorunu Kaydet
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
