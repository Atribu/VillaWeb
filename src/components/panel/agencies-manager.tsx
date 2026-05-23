"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAgencyStatusLabel,
  getAgencyStatusTone,
  type DemoAgencyRecord,
  type DemoAgencyStatus,
} from "@/lib/demo-users-messages";
import { formatCurrency } from "@/lib/villa-catalog";

type AgenciesManagerProps = {
  agencies: DemoAgencyRecord[];
};

const AGENCY_STATUSES: DemoAgencyStatus[] = ["ACTIVE", "PAUSED"];

export function AgenciesManager({ agencies }: AgenciesManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DemoAgencyStatus | "ALL">("ALL");
  const [busyAgencyId, setBusyAgencyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredAgencies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return agencies.filter((agency) => {
      const matchesStatus = selectedStatus === "ALL" || agency.status === selectedStatus;
      const matchesSearch =
        !query ||
        agency.name.toLowerCase().includes(query) ||
        agency.ownerName.toLowerCase().includes(query) ||
        agency.city.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [agencies, searchTerm, selectedStatus]);

  async function updateStatus(agencyId: string, status: DemoAgencyStatus) {
    setBusyAgencyId(agencyId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/agencies/${agencyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Acenta guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Acenta durumu guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Acenta guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyAgencyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Acenta, sahip veya sehir ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as DemoAgencyStatus | "ALL")}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum acentalar</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PAUSED">Pasif</option>
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
        {filteredAgencies.map((agency) => (
          <article
            key={agency.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getAgencyStatusTone(
                      agency.status,
                    )}`}
                  >
                    {getAgencyStatusLabel(agency.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {agency.kind === "DIRECT_WEB"
                      ? "Direkt Kanal"
                      : agency.kind === "INTERNAL"
                        ? "Merkez Ekip"
                        : "Partner Acenta"}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{agency.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {agency.ownerName} · {agency.city}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Talep", `${agency.requestCount}`],
                    ["Pipeline", formatCurrency(agency.openPipeline)],
                    ["Onayli gelir", formatCurrency(agency.approvedRevenue)],
                    ["Not", agency.note],
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
                  Durum Yonetimi
                </p>
                <select
                  value={agency.status}
                  disabled={busyAgencyId === agency.id}
                  onChange={(event) =>
                    updateStatus(agency.id, event.target.value as DemoAgencyStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {AGENCY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getAgencyStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}

        {filteredAgencies.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreler icin gosterilecek acenta kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
