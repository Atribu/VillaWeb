"use client";
import { useState } from "react";
import { calendarDays } from "@/lib/panel-workspace";
import { nightlyPeriodPrice, type PricingPeriodInput } from "@/lib/villa-pricing-periods";
import { formatCurrency } from "@/lib/villa-catalog";
import { Field, usePlatformAction } from "./platform-controls";
export function AdvancedPricing({ companyId, villas }: { companyId: string; villas: { id: string; title: string }[] }) {
  const action = usePlatformAction(); const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<PricingPeriodInput>({ title: "", startDate: "", endDate: "", nightlyPrice: 0, minNightCount: 1, weekendPercent: 0, earlyBookingDays: 0, earlyBookingPercent: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const fingerprint = JSON.stringify([form, selected]);
  const days = /^\d{4}-\d{2}-\d{2}$/.test(form.startDate) ? calendarDays(form.startDate.slice(0, 7)) : [];
  return <div className="work-stack">{action.feedback}<form className="work-card grid gap-4 md:grid-cols-2" onSubmit={async event => { event.preventDefault();
    const result = await action.run("pricing", { companyId, ids: selected, period: form, preview: true }); if (result) { setPreview(fingerprint); action.setMessage(`${selected.length} villa kontrol edildi. Kaydetmeden önce aşağıdaki fiyatları inceleyin.`); }
  }}><fieldset className="md:col-span-2"><legend className="mb-3 font-semibold">Uygulanacak villalar</legend><div className="grid max-h-64 gap-2 overflow-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">{villas.map(villa => <label key={villa.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(villa.id)} onChange={e => setSelected(e.target.checked ? [...selected, villa.id] : selected.filter(id => id !== villa.id))} />{villa.title}</label>)}</div></fieldset>
    <Field label="Dönem adı"><input className="panel-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
    {([ ["startDate", "İlk gece"], ["endDate", "Son gece (dahil)"] ] as const).map(([key, label]) => <Field key={key} label={label}><input className="panel-input" type="date" required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></Field>)}
    {([ ["nightlyPrice", "Gecelik fiyat (TL)", 1, 999999999], ["minNightCount", "Minimum gece", 1, 365], ["weekendPercent", "Cuma / cumartesi farkı (%)", -90, 500], ["earlyBookingDays", "Erken rezervasyon: en az kaç gün önce?", 0, 730], ["earlyBookingPercent", "Erken rezervasyon indirimi (%)", 0, 90] ] as const).map(([key, label, min, max]) => <Field key={key} label={label}><input className="panel-input" type="number" min={min} max={max} step={key === "earlyBookingDays" || key === "minNightCount" ? 1 : 0.01} value={form[key] ?? 0} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} /></Field>)}
    <p className="text-sm leading-6 text-slate-600 md:col-span-2">Önce dönem fiyatı, ardından cuma/cumartesi farkı uygulanır. Erken rezervasyon ve kampanyadan daha avantajlı olan seçilir; kupon bunun üzerine uygulanır. Mevcut dönemlerin üzerine yazılmaz; tek bir çakışmada tüm işlem durur.</p>
    <button className="panel-button-secondary" disabled={action.busy || !selected.length}>Kontrol et ve önizle</button><button type="button" disabled={action.busy || preview !== fingerprint} className="panel-button-primary" onClick={async () => {
      if (!window.confirm(`${selected.length} villaya bu fiyat dönemi eklensin mi?`)) return;
      if (await action.run("pricing", { companyId, ids: selected, period: form, preview: false })) { setPreview(null); action.setMessage("Dönemler kaydedildi. Villa düzenleme ekranından tek tek yönetebilirsiniz."); }
    }}>Seçili villalara uygula</button>
  </form>{days.length > 0 && form.nightlyPrice > 0 && <section className="work-card"><h2 className="font-semibold">{form.startDate.slice(0, 7)} fiyat önizlemesi</h2><p className="my-2 text-xs text-slate-500">Erken rezervasyon ve kupon öncesi gecelik fiyatlar. Yalnızca seçilen dönem gösterilir.</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-7">{days.filter(day => day >= form.startDate && day <= form.endDate).map(date => <div key={date} className="rounded-lg border border-slate-200 p-2"><time className="text-xs text-slate-500">{date.slice(8)}</time><p className="mt-1 text-xs font-semibold">{formatCurrency(nightlyPeriodPrice({ ...form, id: "preview", active: true }, form.nightlyPrice, date, date, date).regular)}</p></div>)}</div></section>}</div>;
}
