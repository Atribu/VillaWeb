"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMessagePriorityLabel,
  getMessageStatusLabel,
  getMessageStatusTone,
  type DemoInternalMessageRecord,
  type DemoMessageStatus,
} from "@/lib/demo-users-messages";
import { formatShortDate } from "@/lib/villa-catalog";

type InternalMessagesManagerProps = {
  messages: DemoInternalMessageRecord[];
};

const MESSAGE_STATUSES: DemoMessageStatus[] = ["NEW", "READ", "RESOLVED", "ARCHIVED"];

export function InternalMessagesManager({ messages }: InternalMessagesManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoMessageStatus | "ALL">("ALL");
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredMessages = useMemo(() => {
    if (selectedStatus === "ALL") {
      return messages;
    }

    return messages.filter((item) => item.status === selectedStatus);
  }, [messages, selectedStatus]);

  async function updateStatus(messageId: string, status: DemoMessageStatus) {
    setBusyMessageId(messageId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Mesaj durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Mesaj durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Mesaj guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyMessageId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus("ALL")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            selectedStatus === "ALL"
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Tum mesajlar ({messages.length})
        </button>
        {MESSAGE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedStatus === status
                ? "bg-[#2b78ad] text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {getMessageStatusLabel(status)} (
            {messages.filter((item) => item.status === status).length})
          </button>
        ))}
      </div>

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
        {filteredMessages.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getMessageStatusTone(
                      item.status,
                    )}`}
                  >
                    {getMessageStatusLabel(item.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getMessagePriorityLabel(item.priority)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {item.relatedModule}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{item.subject}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.senderName} → {item.recipientLabel} ·{" "}
                    {formatShortDate(item.createdAt.slice(0, 10))}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                  {item.body}
                </div>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Mesaj Durumu
                </p>
                <select
                  value={item.status}
                  disabled={busyMessageId === item.id}
                  onChange={(event) =>
                    updateStatus(item.id, event.target.value as DemoMessageStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {MESSAGE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getMessageStatusLabel(status)}
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
