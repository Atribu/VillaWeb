"use client";

import { useMemo, useState } from "react";
import {
  getCustomerSegmentLabel,
  getCustomerSegmentTone,
  type DemoCustomerRecord,
  type DemoCustomerSegment,
} from "@/lib/demo-crm";
import { getRequestOriginLabel } from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type CustomersManagerProps = {
  customers: DemoCustomerRecord[];
};

export function CustomersManager({ customers }: CustomersManagerProps) {
  const [selectedSegment, setSelectedSegment] = useState<DemoCustomerSegment | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSegment = selectedSegment === "ALL" || customer.segment === selectedSegment;
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        customer.fullName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.preferredVillaTitle.toLowerCase().includes(query);

      return matchesSegment && matchesSearch;
    });
  }, [customers, searchTerm, selectedSegment]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Musteri, e-posta, telefon veya tercih edilen villa ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <select
            value={selectedSegment}
            onChange={(event) =>
              setSelectedSegment(event.target.value as DemoCustomerSegment | "ALL")
            }
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum segmentler</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Aktif Aday</option>
            <option value="RETURNING">Tekrar Gelen</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCustomerSegmentTone(
                      customer.segment,
                    )}`}
                  >
                    {getCustomerSegmentLabel(customer.segment)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getRequestOriginLabel(customer.origin)}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{customer.fullName}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {customer.email} · {customer.phone}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Toplam kayit", `${customer.totalRequests}`],
                    ["Onayli rezervasyon", `${customer.approvedReservations}`],
                    ["Pipeline", formatCurrency(customer.pipelineValue)],
                    ["Tercih edilen villa", customer.preferredVillaTitle],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {customer.notes.map((note) => (
                    <span
                      key={note}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Son Aktivite
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {formatCurrency(customer.totalRevenue)}
                </p>
                <p className="mt-2 text-sm text-slate-600">Onayli rezervasyon ciro etkisi</p>
                <div className="mt-4 rounded-[1rem] bg-white px-4 py-4 text-sm text-slate-600">
                  Son kayit tarihi:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(customer.lastRequestAt.slice(0, 10))}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreler icin gosterilecek musteri kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
