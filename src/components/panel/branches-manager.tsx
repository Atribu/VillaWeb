"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getBranchStatusLabel,
  getBranchStatusTone,
  type DemoBranchRecord,
  type DemoBranchStatus,
} from "@/lib/demo-users-messages";
import { formatCurrency } from "@/lib/villa-catalog";

type BranchesManagerProps = {
  branches: DemoBranchRecord[];
};

const BRANCH_STATUSES: DemoBranchStatus[] = ["ACTIVE", "PAUSED"];

export function BranchesManager({ branches }: BranchesManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoBranchStatus | "ALL">("ALL");
  const [busyBranchId, setBusyBranchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredBranches = useMemo(() => {
    if (selectedStatus === "ALL") {
      return branches;
    }

    return branches.filter((branch) => branch.status === selectedStatus);
  }, [branches, selectedStatus]);

  async function updateStatus(branchId: string, status: DemoBranchStatus) {
    setBusyBranchId(branchId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Sube guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Sube durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Sube guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyBranchId(null);
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
          Tum subeler ({branches.length})
        </button>
        {BRANCH_STATUSES.map((status) => (
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
            {getBranchStatusLabel(status)} (
            {branches.filter((branch) => branch.status === status).length})
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
        {filteredBranches.map((branch) => (
          <article
            key={branch.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getBranchStatusTone(
                      branch.status,
                    )}`}
                  >
                    {getBranchStatusLabel(branch.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {branch.agencyName}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{branch.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {branch.city} · {branch.phone}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Kullanici", `${branch.userCount}`],
                    ["Talep", `${branch.requestCount}`],
                    ["Onayli gelir", formatCurrency(branch.approvedRevenue)],
                    ["Bagli acenta", branch.agencyName],
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
                  Durum Guncelle
                </p>
                <select
                  value={branch.status}
                  disabled={busyBranchId === branch.id}
                  onChange={(event) =>
                    updateStatus(branch.id, event.target.value as DemoBranchStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {BRANCH_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getBranchStatusLabel(status)}
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
