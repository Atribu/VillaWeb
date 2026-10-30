import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth/server-session";
import { hasPermission } from "@/lib/auth/permissions";
import { PanelAccessError } from "@/lib/auth/access-error";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import { getFallbackTeamUsers } from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { getDemoRequests, getDemoOperationTasks } from "@/lib/server/demo-operations-store";
import { getDemoPayments } from "@/lib/server/demo-finance-store";
import { getDemoIcalSources } from "@/lib/server/demo-calendar-sync-store";
import { writePanelAudit } from "@/lib/server/panel-audit";
import { listWorkRecords, changeWorkRecord, requirePanelPermission } from "@/lib/server/panel-work-records";
import { isOverdue, optionalText, requiredText, validDateTime, type TeamOption, type PanelNotice } from "@/lib/panel-workspace";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { todayInTurkey, shiftDateKey } from "@/lib/booking-dates";

export async function getWorkspaceTeam(): Promise<TeamOption[]> {
  const actor = await getUserSession();
  if (!actor || actor.role === "OWNER") throw new PanelAccessError();
  const companyId = await resolvePanelCompanyId();
  return withDevelopmentFallback<TeamOption[]>(async () => (await db.companyMembership.findMany({
    where: { ...(companyId ? { companyId } : {}), status: "ACTIVE", user: { isActive: true } },
    select: { companyId: true, role: true, user: { select: { id: true, name: true } } },
  })).map(row => ({ id: row.user.id, companyId: row.companyId, name: row.user.name, role: row.role })),
  async () => (await getFallbackTeamUsers(companyId)).filter(user => user.status === "ACTIVE")
    .map(user => ({ id: user.id, companyId: user.companyId, name: user.fullName, role: user.roleId })));
}
export async function validateAssignee(companyId: string, userId: unknown, owner = false) {
  const id = requiredText(userId, "Sorumlu kullanıcı");
  const person = (await getWorkspaceTeam()).find(user => user.id === id && user.companyId === companyId && (owner ? user.role === "OWNER" : user.role !== "OWNER"));
  if (!person) throw new PanelRecordError("Kullanıcı bu firmanın aktif ve uygun yetkili üyelerinden olmalı.");
  return person;
}
export async function saveTask(input: Record<string, unknown>) {
  const actor = await requirePanelPermission("workspace");
  const companyId = requiredText(input.companyId ?? actor.companyId, "Firma");
  await assertPanelCompanyAccess(companyId);
  const person = await validateAssignee(companyId, input.assigneeId);
  const title = requiredText(input.title, "Görev başlığı");
  const detail = optionalText(input.detail);
  const dueAt = validDateTime(input.dueAt, true);
  const status = input.status ?? "OPEN";
  if (!["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"].includes(String(status))) throw new PanelRecordError("Geçersiz görev durumu.");
  const subjectId = input.id ? requiredText(input.id, "Görev") : randomUUID();
  return changeWorkRecord({ kind: "TASK", companyId, subjectId, version: input.version as number ?? 0 }, async current => {
    if (input.id && !current) throw new PanelRecordError("Görev bulunamadı.", 404);
    if (current && !["ADMIN", "SUPER_ADMIN"].includes(actor.role) && current.userId !== actor.id && current.data.createdBy !== actor.id) throw new PanelAccessError();
    return { userId: person.id, data: { title, detail, dueAt, status, assigneeName: person.name,
      createdBy: current?.data.createdBy ?? actor.id, changedBy: actor.displayName } };
  });
}
export async function saveFollowUp(input: Record<string, unknown>) {
  const actor = await requirePanelPermission("reservations");
  const requestId = requiredText(input.requestId, "Talep");
  const request = (await getDemoRequests()).find(row => row.id === requestId);
  if (!request) throw new PanelRecordError("Talep bulunamadı.", 404);
  const person = input.assigneeId ? await validateAssignee(request.companyId, input.assigneeId) : null;
  const nextContactAt = validDateTime(input.nextContactAt);
  const lastContactAt = validDateTime(input.lastContactAt);
  if (lastContactAt && Date.parse(lastContactAt) > Date.now() + 60000) throw new PanelRecordError("Son iletişim gelecekte olamaz.");
  const note = optionalText(input.note);
  return changeWorkRecord({ kind: "FOLLOWUP", companyId: request.companyId, subjectId: requestId, version: input.version as number ?? 0 }, async (_current, tx) => {
    await writePanelAudit({ companyId: request.companyId, entityType: "REQUEST", entityId: requestId, action: "FOLLOWUP_UPDATED",
      summary: `Satış takibi güncellendi. Sorumlu: ${person?.name ?? "Atanmadı"}.` }, tx);
    return { userId: person?.id ?? null, data: { nextContactAt, lastContactAt, note, assigneeName: person?.name ?? "", changedBy: actor.displayName } };
  });
}
export async function getSalesWorkspace() {
  await requirePanelPermission("reservations");
  return { requests: await getDemoRequests(), followUps: await listWorkRecords("FOLLOWUP"), team: (await getWorkspaceTeam()).filter(user => user.role !== "OWNER") };
}
export async function getWorkCenter() {
  const actor = await requirePanelPermission("workspace");
  const tasks = (await listWorkRecords("TASK")).filter(row => ["ADMIN", "SUPER_ADMIN"].includes(actor.role) || row.userId === actor.id || row.data.createdBy === actor.id);
  const reads = new Set((await listWorkRecords("READ", undefined, actor.id)).map(row => row.data.key));
  const notices: PanelNotice[] = [];
  const today = todayInTurkey();
  function add(companyId: string | undefined, key: string, title: string, detail: string, href: string, category: string, urgent = false) {
    if (companyId) notices.push({ companyId, key, title, detail, href, category, urgent, read: reads.has(key) });
  }
  if (hasPermission(actor.role, "reservations")) {
    const requests = await getDemoRequests();
    for (const row of requests) {
      if (row.status === "NEW") add(row.companyId, `request:${row.id}`, "Yeni talep", `${row.fullName} · ${row.villaTitle}`, `/panel/talepler/${row.id}`, "Talepler");
      if (row.status === "APPROVED" && row.checkIn >= today && row.checkIn <= shiftDateKey(today, 2)) add(row.companyId, `arrival:${row.id}:${row.checkIn}`, "Yaklaşan giriş", `${row.villaTitle} · ${row.checkIn}`, `/panel/talepler/${row.id}`, "Girişler", row.checkIn === today);
    }
    for (const follow of await listWorkRecords("FOLLOWUP")) {
      const request = requests.find(row => row.id === follow.subjectId && !["APPROVED", "CANCELLED"].includes(row.status));
      if (request && isOverdue(follow.data.nextContactAt)) add(follow.companyId, `follow:${follow.id}:${follow.data.nextContactAt}`, "Geri dönüş zamanı", `${request.fullName} · ${follow.data.assigneeName || "Sorumlu atanmadı"}`, `/panel/satis-takibi?request=${request.id}`, "Satış", true);
    }
  }
  if (hasPermission(actor.role, "finance")) for (const row of await getDemoPayments()) {
    if (row.status === "PENDING" && row.dueDate < today) add(row.companyId, `payment:${row.id}:${row.dueDate}`, "Geciken ödeme", `${row.villaTitle} · Vade ${row.dueDate}`, "/panel/muhasebe/odeme-takip", "Ödemeler", true);
  }
  if (hasPermission(actor.role, "calendar")) for (const row of await getDemoIcalSources()) {
    if (row.active && row.status !== "HEALTHY") add(row.companyId, `sync:${row.id}:${row.lastAttemptAt ?? row.lastSyncedAt}:${row.status}`, "Takvim kontrolü gerekli", `${row.villaTitle} · ${row.channelName}`, "/panel/takvim-senkronizasyon/senkron-loglari", "Senkronizasyon", row.status === "ERROR");
  }
  if (hasPermission(actor.role, "operations")) for (const row of await getDemoOperationTasks()) {
    if (!["DONE", "CANCELLED"].includes(row.status) && row.scheduledDate <= today) add(row.companyId, `operation:${row.id}:${row.scheduledDate}`, row.title, `${row.villaTitle} · ${row.assignee}`, "/panel/takip-operasyon/ev-operasyon", "Operasyon", row.scheduledDate < today);
  }
  if (hasPermission(actor.role, "users")) for (const row of await listWorkRecords("OWNER_REQUEST")) {
    if (row.data.status === "PENDING") add(row.companyId, `owner:${row.id}`, "Villa sahibi onayı bekliyor", `${row.data.villaTitle} · ${row.data.startDate}`, "/panel/villa-sahipleri", "Onaylar");
  }
  for (const row of tasks) if (!["DONE", "CANCELLED"].includes(String(row.data.status)) && (row.userId === actor.id || ["ADMIN", "SUPER_ADMIN"].includes(actor.role))) {
    add(row.companyId, `task:${row.id}:${row.data.dueAt}`, String(row.data.title), String(row.data.assigneeName), "/panel/is-merkezi#tasks", "Görevler", isOverdue(row.data.dueAt));
  }
  return { notices: notices.sort((a, b) => Number(b.urgent) - Number(a.urgent)), tasks,
    team: (await getWorkspaceTeam()).filter(user => user.role !== "OWNER"), actorId: actor.id, admin: ["ADMIN", "SUPER_ADMIN"].includes(actor.role) };
}
export async function markNoticeRead(key: string) {
  const actor = await requirePanelPermission("workspace");
  const notice = (await getWorkCenter()).notices.find(row => row.key === key);
  if (!notice) throw new PanelRecordError("Bildirim bulunamadı.", 404);
  const subjectId = createHash("sha256").update(`${actor.id}:${key}`).digest("hex");
  return changeWorkRecord({ kind: "READ", companyId: notice.companyId, subjectId }, async () => ({ userId: actor.id, data: { key } }));
}
