"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_OPTIONS, type DemoRequest, type RequestStatus } from "@/lib/demo-operations";
import { isOverdue, type WorkRecord, type TeamOption } from "@/lib/panel-workspace";
import { PanelDialog } from "@/components/panel/panel-dialog";
import { useWorkspaceAction, WorkMessage, localInputDate, isoInput, displayDate } from "@/components/panel/workspace-controls";

export function SalesBoard({ requests, followUps, team, initialRequest }: { requests: DemoRequest[]; followUps: WorkRecord[]; team: TeamOption[]; initialRequest?: string }) {
  const action = useWorkspaceAction(); const router = useRouter();
  const [q, setQ] = useState(""); const [overdue, setOverdue] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialRequest ?? null);
  const [transition, setTransition] = useState<{ request: DemoRequest; status: RequestStatus } | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const current = requests.find(row => row.id === selected);
  const follow = followUps.find(row => row.subjectId === selected);
  async function changeStatus() {
    if (!transition || busy) return;
    setBusy(true); setError("");
    try { const response = await fetch(`/api/demo/requests/${encodeURIComponent(transition.request.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: transition.status, villaSlug: transition.request.villaSlug }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Durum değiştirilemedi."); setTransition(null); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "İşlem tamamlanamadı."); } finally { setBusy(false); }
  }
  const visible = requests.filter(row => `${row.fullName} ${row.villaTitle} ${row.phone}`.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")) && (!overdue || (!['APPROVED', 'CANCELLED'].includes(row.status) && isOverdue(followUps.find(f => f.subjectId === row.id)?.data.nextContactAt))));
  return <div className="work-stack"><div className="work-toolbar"><input aria-label="Talep ara" placeholder="Misafir, villa veya telefon ara" value={q} onChange={e => setQ(e.target.value)} /><label className="work-check"><input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} /> Geri dönüşü gecikenler</label><Link href="/panel/talepler">Liste görünümü</Link></div>
    <WorkMessage>{action.message}</WorkMessage>
    <div className="sales-board">{REQUEST_STATUS_OPTIONS.map(status => <section className="sales-column" key={status.value}><h2>{status.label}<span>{visible.filter(row => row.status === status.value).length}</span></h2>
      {visible.filter(row => row.status === status.value).map(row => { const meta = followUps.find(f => f.subjectId === row.id); return <article className="sales-card" key={row.id}><Link href={`/panel/talepler/${encodeURIComponent(row.id)}`}><h3>{row.fullName}</h3></Link><p>{row.villaTitle}</p><p>{row.checkIn} → {row.checkOut}</p><p className="work-muted">Sorumlu: {String(meta?.data.assigneeName || "Atanmadı")}</p><p className={isOverdue(meta?.data.nextContactAt) && !["APPROVED", "CANCELLED"].includes(row.status) ? "work-alert" : "work-muted"}>Sonraki görüşme: {displayDate(meta?.data.nextContactAt)}</p><p className="work-muted">Son iletişim: {displayDate(meta?.data.lastContactAt)}</p>
        <button className="panel-button-secondary" onClick={() => setSelected(row.id)}>Takibi düzenle</button><label className="work-label">Durum<select value={row.status} onChange={e => { setError(""); setTransition({ request: row, status: e.target.value as RequestStatus }); }}>{REQUEST_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      </article>; })}
      {!visible.some(row => row.status === status.value) && <p className="work-empty">Talep yok</p>}
    </section>)}</div>
    <PanelDialog open={Boolean(current)} title="İletişim ve takip planı" onClose={() => setSelected(null)} busy={action.busy}>{current && <form className="work-form" key={`${current.id}:${follow?.version ?? 0}`} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void action.run("followups", { requestId: current.id, version: follow?.version ?? 0, assigneeId: f.get("assigneeId"), nextContactAt: isoInput(f.get("nextContactAt")), lastContactAt: isoInput(f.get("lastContactAt")), note: f.get("note") }, () => setSelected(null)); }}>
      <p>{current.fullName} · {current.villaTitle}</p><label>Sorumlu<select name="assigneeId" defaultValue={follow?.userId ?? ""}><option value="">Atanmamış</option>{team.filter(row => row.companyId === current.companyId).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label>Son iletişim<input type="datetime-local" name="lastContactAt" defaultValue={localInputDate(follow?.data.lastContactAt)} /></label><label>Sonraki görüşme<input type="datetime-local" name="nextContactAt" defaultValue={localInputDate(follow?.data.nextContactAt)} /></label><label>Ekip notu<textarea name="note" maxLength={2000} defaultValue={String(follow?.data.note ?? "")} /></label><WorkMessage>{action.message}</WorkMessage><button className="panel-button-primary" disabled={action.busy}>Takibi kaydet</button>
    </form>}</PanelDialog>
    <PanelDialog open={Boolean(transition)} title="Talep durumunu değiştir" onClose={() => setTransition(null)} busy={busy}><p>{transition?.request.fullName}: {REQUEST_STATUS_OPTIONS.find(s => s.value === transition?.status)?.label}</p><p className="work-muted">Onay işlemi müsaitliği kontrol eder ve rezervasyon/finans akışını başlatır. İptal ilgili rezervasyon bloklarını kaldırır.</p><WorkMessage>{error}</WorkMessage><button className="panel-button-primary" disabled={busy} onClick={changeStatus}>Değişikliği onayla</button></PanelDialog>
  </div>;
}
