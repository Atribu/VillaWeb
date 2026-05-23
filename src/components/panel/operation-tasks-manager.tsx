"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOperationTaskPriorityLabel,
  getOperationTaskStatusLabel,
  getOperationTaskStatusTone,
  getOperationTaskTypeLabel,
  type DemoOperationTask,
  type DemoOperationTaskStatus,
} from "@/lib/demo-operations-workflow";
import { formatShortDate } from "@/lib/villa-catalog";

type OperationTasksManagerProps = {
  tasks: DemoOperationTask[];
  emptyMessage: string;
};

const TASK_STATUSES: DemoOperationTaskStatus[] = [
  "PENDING",
  "READY",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export function OperationTasksManager({ tasks, emptyMessage }: OperationTasksManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoOperationTaskStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = selectedStatus === "ALL" || task.status === selectedStatus;
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        task.villaTitle.toLowerCase().includes(query) ||
        task.guestName.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, selectedStatus, tasks]);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      ready: tasks.filter((task) => task.status === "READY").length,
      progress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      done: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  async function handleStatusChange(taskId: string, status: DemoOperationTaskStatus) {
    setBusyTaskId(taskId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/operations/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Gorev durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Operasyon gorevi basariyla guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Gorev guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          ["Toplam gorev", summary.total],
          ["Hazir", summary.ready],
          ["Islemde", summary.progress],
          ["Tamamlandi", summary.done],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Villa, misafir, görev başlığı veya ekip ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as DemoOperationTaskStatus | "ALL")}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum durumlar</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getOperationTaskStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
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
        {filteredTasks.map((task) => (
          <article
            key={task.id}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getOperationTaskStatusTone(
                      task.status,
                    )}`}
                  >
                    {getOperationTaskStatusLabel(task.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getOperationTaskTypeLabel(task.taskType)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getOperationTaskPriorityLabel(task.priority)}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{task.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{task.detail}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Villa", task.villaTitle],
                    ["Misafir", task.guestName],
                    ["Planlanan", `${formatShortDate(task.scheduledDate)} · ${task.scheduledTimeLabel}`],
                    ["Ekip", task.assignee],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {task.supplierName ? (
                  <div className="rounded-[1.2rem] border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
                    Tedarikci: <span className="font-semibold text-slate-900">{task.supplierName}</span>
                  </div>
                ) : null}
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Gorev Durumu
                </p>
                <select
                  value={task.status}
                  disabled={busyTaskId === task.id}
                  onChange={(event) =>
                    handleStatusChange(task.id, event.target.value as DemoOperationTaskStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getOperationTaskStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <div className="mt-4 rounded-[1rem] bg-white px-4 py-4 text-sm text-slate-600">
                  Bu gorev `{task.requestId}` rezervasyon kaydina baglidir. Gorev ilerledikce takip
                  ekranlarindaki ilerleme yuzdesi de guncellenir.
                </div>
              </div>
            </div>
          </article>
        ))}

        {filteredTasks.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
