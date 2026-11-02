"use client";
import type { ReactNode } from "react";
import { useState } from "react";

export function CompanyPicker({ companies, companyId }: { companies: { id: string; name: string }[]; companyId: string }) {
  return <form method="GET" className="flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm font-medium">Firma
    <select name="companyId" defaultValue={companyId} className="panel-input">{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
    <button className="panel-button-secondary">Firmayı göster</button></form>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}{children}</label>; }
export function usePlatformAction() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(false);
  async function run<T>(feature: string, body: unknown): Promise<T | null> {
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch(`/api/panel/platform/${feature}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
      setMessage("İşlem tamamlandı."); return data as T;
    } catch (error) { setError(true); setMessage(error instanceof Error ? error.message : "Bağlantı hatası."); return null; }
    finally { setBusy(false); }
  }
  return { run, busy, setMessage, feedback: message ? <p role={error ? "alert" : "status"} className={`rounded-lg border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p> : null };
}
