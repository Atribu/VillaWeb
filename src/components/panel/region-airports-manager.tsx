"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDefinitionStatusLabel,
  getDefinitionStatusTone,
  type DemoDefinitionStatus,
  type DemoRegionAirportRecord,
} from "@/lib/demo-definitions";
import { formatShortDate } from "@/lib/villa-catalog";

type RegionAirportsManagerProps = {
  regions: DemoRegionAirportRecord[];
};

const DEFINITION_STATUSES: DemoDefinitionStatus[] = ["ACTIVE", "DRAFT", "PASSIVE"];

function deriveLocationName(region: DemoRegionAirportRecord) {
  if (region.regionLabel.includes("&") && region.districtScope[0]) {
    return region.districtScope[0];
  }

  return region.regionLabel;
}

export function RegionAirportsManager({ regions }: RegionAirportsManagerProps) {
  const router = useRouter();
  const [busyRegionId, setBusyRegionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const groupedLocations = regions.reduce<Array<{ location: string; records: DemoRegionAirportRecord[] }>>(
    (groups, region) => {
      const location = deriveLocationName(region);
      const currentGroup = groups.find((group) => group.location === location);

      if (currentGroup) {
        currentGroup.records.push(region);
      } else {
        groups.push({ location, records: [region] });
      }

      return groups;
    },
    [],
  );

  async function updateStatus(regionId: string, status: DemoDefinitionStatus) {
    setBusyRegionId(regionId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/definitions/regions/${regionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Bolge durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Bolge kaydi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Bolge guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyRegionId(null);
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

      <div className="space-y-6">
        {groupedLocations.map((group) => (
          <section
            key={group.location}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
                  Lokasyon
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{group.location}</h3>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {group.records.reduce((sum, region) => sum + region.villaCount, 0)} bagli villa
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {group.records.map((region) => (
                <article
                  key={region.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getDefinitionStatusTone(
                            region.status,
                          )}`}
                        >
                          {getDefinitionStatusLabel(region.status)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                          {region.airportCode}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xl font-semibold text-slate-900">
                          {region.regionLabel}
                        </h4>
                        <p className="mt-2 text-sm text-slate-500">
                          {region.airportName} · {region.driveMinutes} dk transfer
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {[
                          ["Ust il / referans", region.city],
                          ["Bolge sayisi", `${region.districtScope.length || 1}`],
                          ["Bagli villa", `${region.villaCount}`],
                          ["Guncelleme", formatShortDate(region.updatedAt.slice(0, 10))],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="rounded-[1.2rem] bg-white px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(region.districtScope.length > 0
                          ? region.districtScope
                          : [deriveLocationName(region)]
                        ).map((district) => (
                          <span
                            key={district}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                          >
                            {district}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-full max-w-[280px] rounded-[1.5rem] bg-white p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Durum
                      </p>
                      <select
                        value={region.status}
                        disabled={busyRegionId === region.id}
                        onChange={(event) =>
                          updateStatus(region.id, event.target.value as DemoDefinitionStatus)
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
          </section>
        ))}
      </div>
    </div>
  );
}
