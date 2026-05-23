"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPaymentDisplayStatus,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  getPaymentTypeLabel,
  type DemoPaymentDisplayStatus,
  type DemoPaymentRecord,
  type DemoPaymentStatus,
} from "@/lib/demo-finance";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type FinancePaymentsManagerProps = {
  payments: DemoPaymentRecord[];
};

const PAYMENT_STATUSES: DemoPaymentStatus[] = ["PENDING", "PAID", "CANCELLED"];

export function FinancePaymentsManager({ payments }: FinancePaymentsManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoPaymentDisplayStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const displayStatus = getPaymentDisplayStatus(payment);
      const matchesStatus = selectedStatus === "ALL" || displayStatus === selectedStatus;
      const matchesSearch =
        !query ||
        payment.guestName.toLowerCase().includes(query) ||
        payment.villaTitle.toLowerCase().includes(query) ||
        payment.title.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payments, searchTerm, selectedStatus]);

  async function updateStatus(paymentId: string, status: DemoPaymentStatus) {
    setBusyPaymentId(paymentId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/finance/payments/${paymentId}`, {
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
        setMessage(payload.error ?? "Odeme durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Odeme durumu basariyla guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Odeme guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyPaymentId(null);
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
            placeholder="Misafir, villa veya odeme basligi ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as DemoPaymentDisplayStatus | "ALL")
            }
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum odemeler</option>
            <option value="PENDING">Beklemede</option>
            <option value="OVERDUE">Vadesi gecen</option>
            <option value="PAID">Tahsil edilen</option>
            <option value="CANCELLED">Iptal</option>
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
        {filteredPayments.map((payment) => {
          const displayStatus = getPaymentDisplayStatus(payment);

          return (
            <article
              key={payment.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusTone(
                        displayStatus,
                      )}`}
                    >
                      {getPaymentStatusLabel(displayStatus)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {getPaymentTypeLabel(payment.type)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{payment.guestName}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {payment.villaTitle} · {payment.title}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Tutar", formatCurrency(payment.amount)],
                      ["Vade", formatShortDate(payment.dueDate)],
                      ["Yontem", payment.method],
                      ["Tahsilat", payment.paidAt ? formatShortDate(payment.paidAt.slice(0, 10)) : "-"],
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
                    Tahsilat Durumu
                  </p>
                  <select
                    value={payment.status}
                    disabled={busyPaymentId === payment.id}
                    onChange={(event) =>
                      updateStatus(payment.id, event.target.value as DemoPaymentStatus)
                    }
                    className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === "PENDING"
                          ? "Beklemede"
                          : status === "PAID"
                            ? "Tahsil Edildi"
                            : "Iptal"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          );
        })}

        {filteredPayments.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreye uygun odeme kalemi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
