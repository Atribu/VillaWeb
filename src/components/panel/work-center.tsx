"use client";
import Link from "next/link";
import { useState } from "react";
import type { PanelNotice, WorkRecord, TeamOption } from "@/lib/panel-workspace";
import { isOverdue } from "@/lib/panel-workspace";
import { PanelDialog } from "@/components/panel/panel-dialog";
import { useWorkspaceAction, WorkMessage, localInputDate, isoInput, displayDate } from "@/components/panel/workspace-controls";

const statuses = { OPEN: "Açık", IN_PROGRESS: "Devam ediyor", DONE: "Tamamlandı", CANCELLED: "İptal" };
export function WorkCenter({ notices, tasks, team, actorId, admin }: { notices: PanelNotice[]; tasks: WorkRecord[]; team: TeamOption[]; actorId: string; admin: boolean }) {
  const action = useWorkspaceAction();
  const [onlyUnread, setOnlyUnread] = useState(true);
  const [mine, setMine] = useState(false);
  const [editing, setEditing] = useState<WorkRecord | "new" | null>(null);
  const [company, setCompany] = useState("");
  const companies = [...new Set(team.map(row => row.companyId))];
  function open(row: WorkRecord | "new") { setCompany(row === "new" ? companies[0] ?? "" : row.companyId); setEditing(row); }
  const current = editing && editing !== "new" ? editing : null;
  return <div className="work-stack">
    <div className="work-stats"><div><strong>{notices.filter(row => !row.read).length}</strong><span>Okunmamış bildirim</span></div><div><strong>{notices.filter(row => row.urgent).length}</strong><span>Öncelikli konu</span></div><div><strong>{tasks.filter(row => !["DONE", "CANCELLED"].includes(String(row.data.status))).length}</strong><span>Açık görev</span></div></div>
    <WorkMessage>{action.message}</WorkMessage>
    <section className="work-card"><div className="work-heading"><h2>Bildirimler</h2><label className="work-check"><input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} /> Yalnızca okunmamış</label></div>
      <p className="work-muted">Panel içi bildirimlerdir. Okundu olarak işaretlemek ilgili sorunu çözmez.</p>
      {notices.filter(row => !onlyUnread || !row.read).map(row => <div className="work-row" key={`${row.companyId}:${row.key}`}><div><span className={`work-badge ${row.urgent ? "is-alert" : ""}`}>{row.category}</span><Link href={row.href}><h3>{row.title}</h3></Link><p>{row.detail}</p></div><div className="work-actions"><Link href={row.href}>İncele</Link>{!row.read && <button disabled={action.busy} onClick={() => action.run("read", { key: row.key })}>Okundu</button>}</div></div>)}
      {!notices.some(row => !onlyUnread || !row.read) && <p className="work-empty">Bu görünümde bildirim yok.</p>}
    </section>
    <section id="tasks" className="work-card"><div className="work-heading"><h2>Görevler</h2><div className="work-actions"><label className="work-check"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} /> Bana atanan</label><button className="panel-button-primary" onClick={() => open("new")}>Görev ekle</button></div></div>
      {tasks.filter(row => !mine || row.userId === actorId).map(row => <div className="work-row" key={row.id}><div><span className={`work-badge ${isOverdue(row.data.dueAt) && !["DONE", "CANCELLED"].includes(String(row.data.status)) ? "is-alert" : ""}`}>{statuses[row.data.status as keyof typeof statuses]}</span><h3>{String(row.data.title)}</h3><p>{String(row.data.assigneeName)} · Son tarih: {displayDate(row.data.dueAt)}</p><p>{String(row.data.detail || "")}</p></div>{(admin || row.userId === actorId || row.data.createdBy === actorId) && <button className="panel-button-secondary" onClick={() => open(row)}>Düzenle</button>}</div>)}
      {!tasks.some(row => !mine || row.userId === actorId) && <p className="work-empty">Henüz görev yok. Bir sorumlu ve son tarih belirleyerek başlayın.</p>}
    </section>
    <PanelDialog open={Boolean(editing)} title={current ? "Görevi düzenle" : "Yeni görev"} onClose={() => setEditing(null)} busy={action.busy}>
      {editing && <form key={current?.id ?? "new"} className="work-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void action.run("tasks", { id: current?.subjectId, version: current?.version ?? 0, companyId: company, title: data.get("title"), detail: data.get("detail"), assigneeId: data.get("assigneeId"), dueAt: isoInput(data.get("dueAt")), status: data.get("status") }, () => setEditing(null)); }}>
        {companies.length > 1 && !current && <label>Firma<select value={company} onChange={e => setCompany(e.target.value)}>{companies.map(id => <option key={id} value={id}>{id}</option>)}</select></label>}
        <label>Başlık<input required name="title" maxLength={200} defaultValue={String(current?.data.title ?? "")} /></label>
        <label>Açıklama<textarea name="detail" maxLength={2000} defaultValue={String(current?.data.detail ?? "")} /></label>
        <label>Sorumlu<select key={company} name="assigneeId" required defaultValue={current?.userId ?? ""}><option value="">Kullanıcı seçin</option>{team.filter(row => row.companyId === company).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label>Son tarih ve saat<input type="datetime-local" name="dueAt" required defaultValue={localInputDate(current?.data.dueAt)} /></label>
        <label>Durum<select name="status" defaultValue={String(current?.data.status ?? "OPEN")}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <WorkMessage>{action.message}</WorkMessage><button className="panel-button-primary" disabled={action.busy}>Kaydet</button>
      </form>}
    </PanelDialog>
  </div>;
}
