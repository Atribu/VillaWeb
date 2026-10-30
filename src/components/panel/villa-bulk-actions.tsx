"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PanelDialog } from "@/components/panel/panel-dialog";

type Item = { id: string; title: string; status: string; companyId: string };
const SelectionContext = createContext<{ selected: string[]; toggle: (id: string) => void; busy: boolean } | null>(null);
export function VillaSelection({ id, title }: { id: string; title: string }) {
  const context = useContext(SelectionContext);
  if (!context) return null;
  return <input className="h-4 w-4 shrink-0" type="checkbox" checked={context.selected.includes(id)} disabled={context.busy} onChange={() => context.toggle(id)} aria-label={`${title} toplu işlem için seç`} />;
}
export function VillaBulkActions({ villas, children }: { villas: Item[]; children: ReactNode }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState<"PAUSED" | "ARCHIVED" | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selection = villas.filter(villa => selected.includes(villa.id));
  async function apply() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/panel/villas/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: target, selection: selection.map(({ id, status }) => ({ id, status })) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "İşlem uygulanamadı.");
      setSelected([]); setTarget(null); setMessage(`${payload.count} villanın durumu güncellendi.`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bağlantı hatası."); }
    finally { setBusy(false); }
  }
  return <SelectionContext.Provider value={{ selected, busy, toggle: id => { setMessage(""); setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); } }}>
    <div className="panel-bulk-bar"><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy || !villas.length} checked={Boolean(villas.length && selection.length === villas.length)} onChange={event => setSelected(event.target.checked ? villas.map(villa => villa.id) : [])} /> Bu sayfadakileri seç</label><span className="text-xs text-slate-500">{selection.length} villa seçildi</span>
      <button type="button" className="panel-button-secondary" disabled={busy || !selection.length} onClick={() => setTarget("PAUSED")}>Pasife al</button><button type="button" className="panel-button-secondary" disabled={busy || !selection.length} onClick={() => setTarget("ARCHIVED")}>Arşivle</button>
      {!target && message ? <p role="status" className="w-full text-sm">{message}</p> : null}
    </div>{children}
    <PanelDialog open={Boolean(target)} title={`${selection.length} villa ${target === "PAUSED" ? "pasife alınsın" : "arşivlensin"} mı?`} busy={busy} onClose={() => setTarget(null)}>
      <p className="text-sm leading-6 text-slate-600">Seçilen villalar web sitesindeki listeden kaldırılacak. Kayıtları, fotoğrafları ve mevcut rezervasyonları silinmez. Firma yetkileri her kayıt için yeniden kontrol edilir.</p>
      {new Set(selection.map(villa => villa.companyId)).size > 1 ? <p className="mt-3 text-sm font-semibold text-amber-800">Seçiminiz birden fazla firmanın villasını içeriyor.</p> : null}
      <ul className="my-4 max-h-64 space-y-2 overflow-auto text-sm">{selection.map(villa => <li key={villa.id} className="border-b border-slate-100 py-2">{villa.title} <span className="text-xs text-slate-500">({villa.status})</span></li>)}</ul>
      <p role="alert" className="mb-3 text-sm text-rose-700">{message}</p><button type="button" className="panel-button" disabled={busy} onClick={apply}>{busy ? "Uygulanıyor…" : "Onayla ve uygula"}</button>
    </PanelDialog>
  </SelectionContext.Provider>;
}
