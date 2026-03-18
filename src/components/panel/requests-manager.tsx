"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatPercent,
  getRequestStatusLabel,
  getRequestStatusTone,
  REQUEST_STATUS_OPTIONS,
  type DemoRequest,
  type RequestStatus,
} from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type RequestsManagerProps = {
  requests: DemoRequest[];
};

export function RequestsManager({ requests }: RequestsManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | "ALL">("ALL");
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredRequests = useMemo(() => {
    if (selectedStatus === "ALL") {
      return requests;
    }

    return requests.filter((request) => request.status === selectedStatus);
  }, [requests, selectedStatus]);

  const statusSummary = useMemo(
    () =>
      REQUEST_STATUS_OPTIONS.map((option) => ({
        ...option,
        count: requests.filter((request) => request.status === option.value).length,
      })),
    [requests],
  );

  async function handleStatusChange(requestId: string, nextStatus: RequestStatus, villaSlug: string) {
    setBusyRequestId(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          villaSlug,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Talep durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Talep durumu basariyla guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Durum guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-5">
        {statusSummary.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSelectedStatus(item.value)}
            className={`rounded-[1.6rem] border px-5 py-5 text-left transition ${
              selectedStatus === item.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{item.count}</p>
            <p className="mt-2 text-sm leading-7 opacity-80">{item.description}</p>
          </button>
        ))}
      </div>

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
          Tum Talepler ({requests.length})
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-[1.4rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <article
            key={request.id}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getRequestStatusTone(
                      request.status,
                    )}`}
                  >
                    {getRequestStatusLabel(request.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {request.id}
                  </span>
                  {request.couponCode ? (
                    <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
                      Kupon: {request.couponCode}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{request.villaTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {request.fullName} · {request.phone} · {request.email}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Konaklama", `${formatShortDate(request.checkIn)} - ${formatShortDate(request.checkOut)}`],
                    ["Misafir", `${request.guestCount} kisi`],
                    ["Toplam", formatCurrency(request.pricing.grandTotal)],
                    ["Olusturma", formatShortDate(request.createdAt.slice(0, 10))],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.25rem] bg-[var(--color-slate-soft)] px-4 py-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {request.message ? (
                  <div className="rounded-[1.25rem] border border-slate-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                    {request.message}
                  </div>
                ) : null}
              </div>

              <div className="w-full max-w-[320px] space-y-4 rounded-[1.6rem] bg-[var(--color-slate-soft)] p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Durum Guncelle
                  </p>
                  <select
                    value={request.status}
                    disabled={busyRequestId === request.id}
                    onChange={(event) =>
                      handleStatusChange(
                        request.id,
                        event.target.value as RequestStatus,
                        request.villaSlug,
                      )
                    }
                    className="mt-3 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
                  >
                    {REQUEST_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4 text-slate-500">
                    <span>Ara toplam</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(request.pricing.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-500">
                    <span>Kampanya</span>
                    <span className="font-semibold text-slate-900">
                      {request.pricing.activeDiscountTotal > 0
                        ? `- ${formatCurrency(request.pricing.activeDiscountTotal)}`
                        : "Yok"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-500">
                    <span>Kupon</span>
                    <span className="font-semibold text-slate-900">
                      {request.pricing.couponDiscountTotal > 0
                        ? `- ${formatCurrency(request.pricing.couponDiscountTotal)}`
                        : "Yok"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-500">
                    <span>Temizlik</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(request.pricing.cleaningFee)}
                    </span>
                  </div>
                </div>

                {request.pricing.activeDiscountPercent ? (
                  <div className="rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-600">
                    Aktif kampanya:{" "}
                    <span className="font-semibold text-slate-900">
                      {request.pricing.activeDiscountTitle} (
                      {formatPercent(request.pricing.activeDiscountPercent)})
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {filteredRequests.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtre icin gosterilecek talep bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
