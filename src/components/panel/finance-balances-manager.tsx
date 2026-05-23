"use client";

import { useMemo, useState } from "react";
import {
  getInvoiceStatusLabel,
  getInvoiceStatusTone,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  type DemoFinanceBalanceRecord,
  type DemoPaymentDisplayStatus,
} from "@/lib/demo-finance";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type FinanceBalancesManagerProps = {
  balances: DemoFinanceBalanceRecord[];
};

export function FinanceBalancesManager({ balances }: FinanceBalancesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DemoPaymentDisplayStatus | "ALL">("ALL");

  const filteredBalances = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return balances.filter((balance) => {
      const matchesStatus = selectedStatus === "ALL" || balance.paymentStatus === selectedStatus;
      const matchesSearch =
        !query ||
        balance.guestName.toLowerCase().includes(query) ||
        balance.villaTitle.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [balances, searchTerm, selectedStatus]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Misafir veya villa ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as DemoPaymentDisplayStatus | "ALL")
            }
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum bakiyeler</option>
            <option value="PENDING">Bekleyen</option>
            <option value="OVERDUE">Vadesi gecen</option>
            <option value="PAID">Tamamlanan</option>
            <option value="CANCELLED">Iptal</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBalances.map((balance) => (
          <article
            key={balance.invoiceId}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusTone(
                      balance.paymentStatus,
                    )}`}
                  >
                    {getPaymentStatusLabel(balance.paymentStatus)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getInvoiceStatusTone(
                      balance.invoiceStatus,
                    )}`}
                  >
                    {getInvoiceStatusLabel(balance.invoiceStatus)}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{balance.guestName}</h3>
                  <p className="mt-2 text-sm text-slate-500">{balance.villaTitle}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Kontrat", formatCurrency(balance.totalAmount)],
                    ["Tahsil edilen", formatCurrency(balance.collectedAmount)],
                    ["Acik bakiye", formatCurrency(balance.remainingAmount)],
                    [
                      "Son odeme",
                      balance.lastPaidAt ? formatShortDate(balance.lastPaidAt.slice(0, 10)) : "-",
                    ],
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

              <div className="w-full max-w-[300px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Siradaki Tahsilat
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {balance.nextDueAmount ? formatCurrency(balance.nextDueAmount) : "Plan yok"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {balance.nextDueDate
                    ? `${formatShortDate(balance.nextDueDate)} tarihinde bekleniyor`
                    : "Tum odeme kalemleri tamamlandi veya kapatildi."}
                </p>
              </div>
            </div>
          </article>
        ))}

        {filteredBalances.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreler icin gosterilecek bakiye kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
