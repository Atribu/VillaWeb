"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getInvoiceStatusLabel,
  getInvoiceStatusTone,
  type DemoInvoiceRecord,
  type DemoInvoiceStatus,
} from "@/lib/demo-finance";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type FinanceInvoicesManagerProps = {
  invoices: DemoInvoiceRecord[];
};

const INVOICE_STATUSES: DemoInvoiceStatus[] = ["DRAFT", "SENT", "PAID", "CANCELLED"];

export function FinanceInvoicesManager({ invoices }: FinanceInvoicesManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoInvoiceStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus = selectedStatus === "ALL" || invoice.status === selectedStatus;
      const matchesSearch =
        !query ||
        invoice.guestName.toLowerCase().includes(query) ||
        invoice.villaTitle.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [invoices, searchTerm, selectedStatus]);

  async function updateStatus(invoiceId: string, status: DemoInvoiceStatus) {
    setBusyInvoiceId(invoiceId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/finance/invoices/${invoiceId}`, {
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
        setMessage(payload.error ?? "Fatura durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Fatura durumu basariyla guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Fatura guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyInvoiceId(null);
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
            placeholder="Fatura no, misafir veya villa ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as DemoInvoiceStatus | "ALL")
            }
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum faturalar</option>
            {INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getInvoiceStatusLabel(status)}
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
        {filteredInvoices.map((invoice) => (
          <article
            key={invoice.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getInvoiceStatusTone(
                      invoice.status,
                    )}`}
                  >
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {invoice.invoiceNumber}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{invoice.guestName}</h3>
                  <p className="mt-2 text-sm text-slate-500">{invoice.villaTitle}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Fatura tarihi", formatShortDate(invoice.issueDate)],
                    ["Odeme vadesi", formatShortDate(invoice.dueDate)],
                    ["Toplam tutar", formatCurrency(invoice.totalAmount)],
                    ["Kayit kaynagi", "Onayli rezervasyon"],
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
                  value={invoice.status}
                  disabled={busyInvoiceId === invoice.id}
                  onChange={(event) =>
                    updateStatus(invoice.id, event.target.value as DemoInvoiceStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {INVOICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getInvoiceStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}

        {filteredInvoices.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreye uygun fatura kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
