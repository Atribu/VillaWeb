"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRequestOriginLabel,
  getRequestStatusLabel,
  getRequestStatusTone,
  REQUEST_STATUS_OPTIONS,
  type DemoRequest,
  type RequestOrigin,
  type RequestStatus,
} from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type ReservationListManagerProps = {
  requests: DemoRequest[];
};

export function ReservationListManager({ requests }: ReservationListManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | "ALL">("ALL");
  const [selectedOrigin, setSelectedOrigin] = useState<RequestOrigin | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const origin = request.origin ?? "PUBLIC_FORM";
      const matchesStatus = selectedStatus === "ALL" || request.status === selectedStatus;
      const matchesOrigin = selectedOrigin === "ALL" || origin === selectedOrigin;
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        request.villaTitle.toLowerCase().includes(query) ||
        request.fullName.toLowerCase().includes(query) ||
        request.phone.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query);

      return matchesStatus && matchesOrigin && matchesSearch;
    });
  }, [requests, searchTerm, selectedOrigin, selectedStatus]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Toplam kayit",
        value: requests.length,
        detail: "Public form ve panel rezervasyonlari birlikte listelenir.",
      },
      {
        label: "Panelden acilan",
        value: requests.filter((request) => request.origin === "MANUAL_PANEL").length,
        detail: "Operasyon ekibinin manuel girdigi kayitlar.",
      },
      {
        label: "Onayli",
        value: requests.filter((request) => request.status === "APPROVED").length,
        detail: "Takvimi kilitleyen rezervasyonlar.",
      },
      {
        label: "Teklif sureci",
        value: requests.filter((request) => request.status === "QUOTE_SENT").length,
        detail: "Henuz ticari kapanisi tamamlanmayan dosyalar.",
      },
    ],
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
        setMessage(payload.error ?? "Rezervasyon durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Rezervasyon durumu basariyla guncellendi.");
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
      <div className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.55fr_0.55fr_auto]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Villa, misafir, telefon veya kod ara"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as RequestStatus | "ALL")}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum durumlar</option>
            {REQUEST_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedOrigin}
            onChange={(event) => setSelectedOrigin(event.target.value as RequestOrigin | "ALL")}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="ALL">Tum kaynaklar</option>
            <option value="MANUAL_PANEL">Panel rezervasyonlari</option>
            <option value="PUBLIC_FORM">Public form</option>
          </select>

          <Link
            href="/panel/rezervasyonlar/yeni-rezervasyon"
            className="inline-flex items-center justify-center rounded-full bg-[#2b78ad] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#215d86]"
          >
            Yeni Kayit Ac
          </Link>
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

      <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-[#f8fafc]">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Misafir / Villa</th>
                <th className="px-4 py-3 font-medium">Konaklama</th>
                <th className="px-4 py-3 font-medium">Kaynak</th>
                <th className="px-4 py-3 font-medium">Toplam</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">{request.id}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{request.fullName}</p>
                    <p className="mt-1 text-slate-500">{request.villaTitle}</p>
                    <p className="mt-1 text-slate-500">{request.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>
                      {formatShortDate(request.checkIn)} - {formatShortDate(request.checkOut)}
                    </p>
                    <p className="mt-1">{request.guestCount} misafir</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Kayit: {formatShortDate(request.createdAt.slice(0, 10))}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {getRequestOriginLabel(request.origin)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {formatCurrency(request.pricing.grandTotal)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRequestStatusTone(
                        request.status,
                      )}`}
                    >
                      {getRequestStatusLabel(request.status)}
                    </span>

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
                      className="mt-2 w-full rounded-[0.95rem] border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                    >
                      {REQUEST_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/panel/talepler"
                        className="text-sm font-medium text-[#2b78ad] transition hover:text-[#215d86]"
                      >
                        Talep merkezi
                      </Link>
                      <Link
                        href={`/villalar/${request.villaSlug}`}
                        className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                      >
                        Public sayfa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            Secili filtreler icin listelenecek rezervasyon kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
