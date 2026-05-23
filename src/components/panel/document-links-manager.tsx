"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDocumentLinkStatusLabel,
  getDocumentLinkStatusTone,
  type DemoDocumentLinkRecord,
  type DemoDocumentLinkStatus,
} from "@/lib/demo-external-links";
import { formatShortDate } from "@/lib/villa-catalog";

type DocumentLinksManagerProps = {
  links: DemoDocumentLinkRecord[];
};

const DOCUMENT_LINK_STATUSES: DemoDocumentLinkStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];

export function DocumentLinksManager({ links }: DocumentLinksManagerProps) {
  const router = useRouter();
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateStatus(linkId: string, status: DemoDocumentLinkStatus) {
    setBusyLinkId(linkId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/external-links/document-links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Dokuman baglantisi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Dokuman baglantisi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Dokuman baglantisi guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyLinkId(null);
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
        {links.map((link) => (
          <article
            key={link.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getDocumentLinkStatusTone(
                      link.status,
                    )}`}
                  >
                    {getDocumentLinkStatusLabel(link.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {link.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{link.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Son guncelleme {formatShortDate(link.updatedAt.slice(0, 10))}
                  </p>
                </div>

                <a href={link.url} className="inline-flex text-sm font-semibold text-[#2b78ad] underline-offset-4 hover:underline">
                  Baglantiyi ac
                </a>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Durum
                </p>
                <select
                  value={link.status}
                  disabled={busyLinkId === link.id}
                  onChange={(event) =>
                    updateStatus(link.id, event.target.value as DemoDocumentLinkStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {DOCUMENT_LINK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getDocumentLinkStatusLabel(status)}
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
