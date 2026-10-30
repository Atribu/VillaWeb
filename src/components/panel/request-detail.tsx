"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_OPTIONS, getRequestStatusLabel, type DemoRequest } from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import { BookingConfirmationActions } from "@/components/panel/booking-confirmation-actions";
import { PanelDialog } from "@/components/panel/panel-dialog";

export function RequestDetail({ request }: { request: DemoRequest }) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function mutate(kind: "status" | "note") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(kind === "status" ? `/api/demo/requests/${encodeURIComponent(request.id)}` : `/api/panel/requests/${encodeURIComponent(request.id)}/notes`, {
        method: kind === "status" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kind === "status" ? { status } : { note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "İşlem kaydedilemedi.");
      if (kind === "note") setNote("");
      setConfirming(false); setMessage(kind === "note" ? "Ekip notu kaydedildi." : "Talep durumu güncellendi."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bağlantı hatası."); }
    finally { setBusy(false); }
  }
  const pricing = request.pricing;
  return <div className="space-y-6"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section className="rounded-xl border border-slate-200 bg-white p-6"><p className="panel-eyebrow">Misafir ve konaklama</p><h2 className="mt-2 text-xl font-semibold">{request.fullName}</h2>
      <div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="underline" href={`tel:${request.phone}`}>{request.phone}</a><a className="break-all underline" href={`mailto:${request.email}`}>{request.email}</a></div>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">{[["Villa", request.villaTitle], ["Tarihler", `${formatShortDate(request.checkIn)} - ${formatShortDate(request.checkOut)}`], ["Misafir", `${request.guestCount} kişi`], ["Konaklama", `${pricing.nightCount} gece`]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>
      <h3 className="mt-6 text-sm font-semibold">Misafirin mesajı</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{request.message || "Mesaj bırakılmamış."}</p><BookingConfirmationActions request={request} />
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">Fiyat dökümü</h2><p className="mt-2 text-xs text-slate-500">Talep oluşturulurken hesaplanan tutarlar</p>
      <dl className="mt-5 space-y-3 text-sm">{[["Konaklama", pricing.subtotal], ["Kampanya indirimi", -pricing.activeDiscountTotal || 0], ["Kupon indirimi", -pricing.couponDiscountTotal || 0], ["Temizlik", pricing.cleaningFee]].map(([label, amount]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{formatCurrency(Number(amount))}</dd></div>)}<div className="flex justify-between gap-3 border-t border-slate-200 pt-4 font-semibold"><dt>Toplam</dt><dd>{formatCurrency(pricing.grandTotal)}</dd></div></dl>
      {request.couponCode ? <p className="mt-3 text-xs text-slate-500">Kupon: {request.couponCode}</p> : null}
      <label htmlFor="request-next-status" className="mt-6 block text-sm font-medium">Talep durumu</label><select id="request-next-status" className="panel-input mt-2" disabled={busy} value={status} onChange={event => setStatus(event.target.value as typeof status)}>{REQUEST_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <button type="button" className="panel-button mt-3 w-full" disabled={busy || status === request.status} onClick={() => setConfirming(true)}>Durumu güncelle</button>
    </section></div>
    <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">Ekip notu ekle</h2><p className="mt-2 text-sm text-slate-500">Yalnızca bu firmanın yetkili panel kullanıcıları görür. Misafire gönderilmez.</p>
      <form className="mt-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void mutate("note"); }}><label htmlFor="request-note" className="sr-only">Ekip notu</label><textarea id="request-note" className="panel-input" rows={4} maxLength={2000} required value={note} disabled={busy} onChange={event => setNote(event.target.value)} placeholder="Görüşme sonucunu veya ekibin bilmesi gereken bilgiyi yazın." /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{note.length}/2000 karakter</span><button className="panel-button" disabled={busy || !note.trim()}>Notu kaydet</button></div></form>
    </section><p role="status" className="text-sm">{message}</p>
    <PanelDialog open={confirming} title="Talep durumu değiştirilsin mi?" busy={busy} onClose={() => setConfirming(false)}><p className="text-sm leading-6">{getRequestStatusLabel(request.status)} → {getRequestStatusLabel(status)}. Onay işlemi müsaitliği kontrol eder; durum değişikliği takvim ve operasyon kayıtlarını etkileyebilir.</p><button type="button" className="panel-button mt-5" disabled={busy} onClick={() => mutate("status")}>{busy ? "Kaydediliyor…" : "Onayla ve uygula"}</button></PanelDialog>
  </div>;
}
