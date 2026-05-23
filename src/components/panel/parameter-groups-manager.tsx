"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDefinitionStatusLabel,
  getDefinitionStatusTone,
  type DemoDefinitionStatus,
  type DemoParameterGroupRecord,
} from "@/lib/demo-definitions";
import { formatShortDate } from "@/lib/villa-catalog";

type ParameterGroupsManagerProps = {
  groups: DemoParameterGroupRecord[];
};

const DEFINITION_STATUSES: DemoDefinitionStatus[] = ["ACTIVE", "DRAFT", "PASSIVE"];

export function ParameterGroupsManager({ groups }: ParameterGroupsManagerProps) {
  const router = useRouter();
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateStatus(groupId: string, status: DemoDefinitionStatus) {
    setBusyGroupId(groupId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/definitions/parameter-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Parametre grubu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Parametre grubu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Parametre grubu guncellenirken baglanti hatasi olustu.");
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
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getDefinitionStatusTone(
                      group.status,
                    )}`}
                  >
                    {getDefinitionStatusLabel(group.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {group.scope}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{group.label}</h3>
                  <p className="mt-2 text-sm text-slate-500">{group.note}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Toplam item", `${group.itemCount}`],
                    ["Ornekler", group.sampleItems.join(", ")],
                    ["Kapsam", group.scope],
                    ["Guncelleme", formatShortDate(group.updatedAt.slice(0, 10))],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Durum
                </p>
                <select
                  value={group.status}
                  disabled={busyGroupId === group.id}
                  onChange={(event) =>
                    updateStatus(group.id, event.target.value as DemoDefinitionStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {DEFINITION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getDefinitionStatusLabel(status)}
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
