"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export async function workspaceAction(action: string, data: unknown) {
  const response = await fetch(`/api/panel/workspace/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `İşlem tamamlanamadı (${response.status}).`);
  return payload.result;
}
export function useWorkspaceAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: string, data: unknown, success?: () => void) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await workspaceAction(action, data); setMessage("Kaydedildi."); success?.(); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }
  return { busy, message, run };
}
export function WorkMessage({ children }: { children: string }) { return children ? <p role="status" className="work-message">{children}</p> : null; }
export function localInputDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value); if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function isoInput(value: FormDataEntryValue | null) { return value ? new Date(String(value)).toISOString() : ""; }
export function displayDate(value: unknown) { return value ? new Date(String(value)).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" }) : "Belirtilmedi"; }
