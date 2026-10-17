"use client";

import Link from "next/link";
import { useState } from "react";
import type { DemoRequest } from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

export function BookingConfirmationActions({ request }: { request: DemoRequest }) {
  const [message, setMessage] = useState("");
  if (!request.confirmationToken) return null;
  const path = `/rezervasyon/${request.confirmationToken}`;
  const confirmed = request.status === "APPROVED" && Boolean(request.confirmedAt);
  function buildMessage() {
    return [
      `Sayin ${request.fullName},`,
      confirmed ? "Rezervasyonunuz ve odemeniz onaylanmistir." : "Rezervasyon talebiniz alinmistir. Henuz kesinlesmemistir.",
      `Villa: ${request.villaTitle}`,
      `Giris: ${formatShortDate(request.checkIn)} | Cikis: ${formatShortDate(request.checkOut)}`,
      `Misafir: ${request.guestCount} | Toplam: ${formatCurrency(request.pricing.grandTotal)}`,
      `Rezervasyon referansi: ${request.id}`,
      `Guncel durum ve rezervasyon belgesi: ${window.location.origin}${path}`,
    ].join("\n");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(buildMessage()); setMessage("Mesaj kopyalandi."); }
    catch { setMessage("Panoya erisilemedi. Belgeyi acarak paylasabilirsiniz."); }
  }
  return (
    <div className="border-t border-slate-200 pt-4">
      <p className="text-xs text-slate-500">
        {request.termsAcceptedAt ? `Sozlesme onayi: ${formatShortDate(request.termsAcceptedAt.slice(0, 10))} (${request.termsVersion})` : "Dijital sozlesme onayi kayitli degil."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link className="panel-button-secondary" href={path} target="_blank" rel="noreferrer">
          {confirmed ? "Konfirmasyon belgesi" : "Talep durumu"}
        </Link>
        {request.status !== "CANCELLED" ? <>
          <button type="button" className="panel-button-secondary" onClick={copy}>Mesaji kopyala</button>
          {request.email ? <button type="button" className="panel-button-secondary" onClick={() => {
            const subject = confirmed ? "Rezervasyon konfirmasyonu" : "Rezervasyon talebiniz";
            window.location.href = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage())}`;
          }}>E-posta taslagi</button> : null}
        </> : null}
      </div>
      <p role="status" className="mt-2 text-xs text-slate-500">{message}</p>
    </div>
  );
}
