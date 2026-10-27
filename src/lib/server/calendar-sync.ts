import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { CalendarImportError, parseRentalCalendar, type ImportedCalendarEvent } from "@/lib/calendar-import";
import { fetchRentalCalendar } from "@/lib/server/calendar-fetch";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { getFallbackCompanyRecords, getFallbackIcalSources, getFallbackVillas } from "@/lib/server/development-fallback-data";
import { readLocalCalendarState, updateLocalCalendarState } from "@/lib/server/calendar-local-state";
import type { AvailabilityRange } from "@/lib/villa-catalog";

export const CALENDAR_SYNC_INTERVAL_MS = 15 * 60 * 1000;
const LEASE_MS = 2 * 60 * 1000;
type Source = {
  id: string; companyId: string; villaId: string; villaSlug: string; villaTitle: string;
  channelName: string; sourceUrl: string; active: boolean; direction: string; companyActive: boolean;
  local: boolean;
};
export type CalendarSyncResult = {
  sourceId: string; outcome: "SUCCESS" | "WARNING"; eventCount: number;
  added: number; updated: number; removed: number; conflicts: number; message: string;
};

export function importedEventKey(uid: string) { return createHash("sha256").update(uid).digest("hex"); }

async function loadSource(id: string): Promise<Source | null> {
  return withDevelopmentFallback<Source | null>(async () => {
    const source = await db.calendarSyncSource.findUnique({ where: { id }, include: { villa: { select: { slug: true, title: true, companyId: true } }, company: { select: { status: true } } } });
    return source ? { ...source, villaSlug: source.villa.slug, villaTitle: source.villa.title,
      companyActive: source.company.status === "ACTIVE" && source.companyId === source.villa.companyId, local: false } : null;
  }, async () => {
    const source = (await getFallbackIcalSources()).find((item) => item.id === id);
    if (!source?.companyId) return null;
    const villa = (await getFallbackVillas(source.companyId)).find((item) => item.slug === source.villaSlug);
    if (!villa) return null;
    const company = (await getFallbackCompanyRecords()).find((item) => item.id === source.companyId);
    return { ...source, companyId: source.companyId, villaId: villa.id, companyActive: company?.status === "ACTIVE", local: true };
  });
}

function assertSource(source: Source | null): asserts source is Source {
  if (!source) throw new CalendarImportError("Takvim kaynagi bulunamadi.");
  if (!source.active || !source.companyActive) throw new CalendarImportError("Pasif firma veya kaynak senkronize edilemez.");
  if (source.direction !== "IMPORT") throw new CalendarImportError("Disa aktarim icin villa ekranindaki imzali iCal baglantisini dis platforma ekleyin. Bu islem yalnizca ice aktarim yapar.");
}

async function claimSource(source: Source, token: string, dueOnly: boolean) {
  const now = new Date();
  const next = new Date(now.getTime() + CALENDAR_SYNC_INTERVAL_MS);
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  if (source.local) {
    return updateLocalCalendarState(async (state) => {
      const current = await loadSource(source.id);
      assertSource(current);
      if (current.sourceUrl !== source.sourceUrl) return false;
      const old = state.sources[source.id];
      if (old?.leaseUntil && Date.parse(old.leaseUntil) > now.getTime()) return false;
      if (dueOnly && old?.nextSyncAt && Date.parse(old.nextSyncAt) > now.getTime()) return false;
      state.sources[source.id] = { ...old, companyId: source.companyId, villaId: source.villaId, blocks: old?.blocks ?? [],
        status: old?.status ?? "WARNING", lastAttemptAt: now.toISOString(), nextSyncAt: next.toISOString(),
        leaseToken: token, leaseUntil: leaseUntil.toISOString() };
      return true;
    });
  }
  const result = await db.calendarSyncSource.updateMany({ where: {
    id: source.id, companyId: source.companyId, sourceUrl: source.sourceUrl, active: true, direction: "IMPORT", company: { status: "ACTIVE" },
    OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lte: now } }],
    ...(dueOnly ? { nextSyncAt: { lte: now } } : {}),
  }, data: { syncLeaseToken: token, syncLeaseUntil: leaseUntil, lastAttemptAt: now, nextSyncAt: next } });
  return result.count === 1;
}

function makeBlocks(source: Source, events: ImportedCalendarEvent[]): AvailabilityRange[] {
  return events.map((event) => {
    const externalEventId = importedEventKey(event.uid);
    return { id: `ical-${importedEventKey(`${source.id}:${externalEventId}`)}`, calendarSourceId: source.id, externalEventId,
      startDate: event.startDate, endDate: event.endDate, status: "UNAVAILABLE", label: `iCal: ${source.channelName.slice(0, 120)}` };
  });
}

export function reconcileCalendarBlocks(sourceId: string, next: AvailabilityRange[], existing: AvailabilityRange[]): Omit<CalendarSyncResult, "sourceId" | "message" | "outcome"> {
  const own = existing.filter((item) => item.calendarSourceId === sourceId);
  const other = existing.filter((item) => item.calendarSourceId !== sourceId);
  const previous = new Map(own.map((item) => [item.externalEventId, item]));
  const nextIds = new Set(next.map((item) => item.externalEventId));
  return {
    eventCount: next.length,
    added: next.filter((item) => !previous.has(item.externalEventId)).length,
    updated: next.filter((item) => {
      const old = previous.get(item.externalEventId);
      return old && (old.startDate !== item.startDate || old.endDate !== item.endDate || old.label !== item.label);
    }).length,
    removed: own.filter((item) => !nextIds.has(item.externalEventId)).length,
    conflicts: next.filter((item) => other.some((block) => item.startDate < block.endDate && item.endDate > block.startDate)).length,
  };
}

function syncResult(sourceId: string, stats: ReturnType<typeof reconcileCalendarBlocks>): CalendarSyncResult {
  return { sourceId, ...stats, outcome: stats.conflicts ? "WARNING" : "SUCCESS",
    message: `${stats.added} eklendi, ${stats.updated} guncellendi, ${stats.removed} kaldirildi. ${stats.eventCount} takvim bloku mevcut.${stats.conflicts ? ` ${stats.conflicts} kayit baska doluluklarla cakisiyor; iki kayit da korundu, kontrol edin.` : ""}` };
}

async function applyCalendar(source: Source, token: string, events: ImportedCalendarEvent[]) {
  const next = makeBlocks(source, events);
  if (source.local) {
    return updateLocalCalendarState(async (state) => {
      const current = await loadSource(source.id);
      assertSource(current);
      const runtime = state.sources[source.id];
      if (!runtime || runtime.leaseToken !== token || current.sourceUrl !== source.sourceUrl || current.villaId !== source.villaId || current.companyId !== source.companyId || Date.parse(runtime.leaseUntil ?? "") <= Date.now()) throw new CalendarImportError("Kaynak senkron sirasinda degisti veya kilit suresi doldu; yeniden deneyin.");
      const villa = (await getFallbackVillas(source.companyId)).find((item) => item.id === source.villaId);
      if (!villa) throw new CalendarImportError("Villa bulunamadi.");
      const result = syncResult(source.id, reconcileCalendarBlocks(source.id, next, villa.availabilityRanges));
      const now = new Date();
      Object.assign(runtime, { blocks: next, status: result.outcome === "WARNING" ? "WARNING" : "HEALTHY", lastSyncedAt: now.toISOString(),
        nextSyncAt: new Date(now.getTime() + CALENDAR_SYNC_INTERVAL_MS).toISOString(), leaseToken: undefined, leaseUntil: undefined });
      state.logs.push({ id: randomUUID(), sourceId: source.id, companyId: source.companyId, villaSlug: source.villaSlug,
        villaTitle: source.villaTitle, channelName: source.channelName, outcome: result.outcome, eventCount: result.eventCount, message: result.message, createdAt: now.toISOString() });
      return result;
    });
  }
  return db.$transaction(async (tx) => {
    // Same villa lock as booking approval: an import cannot race a new reservation.
    await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${source.villaId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "CalendarSyncSource" WHERE id = ${source.id} FOR UPDATE`;
    const current = await tx.calendarSyncSource.findUnique({ where: { id: source.id }, include: { company: { select: { status: true } } } });
    if (!current || current.syncLeaseToken !== token || !current.active || current.company.status !== "ACTIVE" ||
        current.sourceUrl !== source.sourceUrl || current.companyId !== source.companyId || current.villaId !== source.villaId || current.direction !== "IMPORT" || !current.syncLeaseUntil || current.syncLeaseUntil.getTime() <= Date.now()) {
      throw new CalendarImportError("Kaynak senkron sirasinda degisti veya kilit suresi doldu; yeniden deneyin.");
    }
    const existing = await tx.villaAvailabilityBlock.findMany({ where: { villaId: source.villaId } });
    const ranges: AvailabilityRange[] = existing.map((item) => ({ id: item.id, startDate: item.startsAt.toISOString().slice(0, 10),
      endDate: new Date(item.endsAt.getTime() + (item.endsAt.getUTCHours() === 23 ? 86400000 : 0)).toISOString().slice(0, 10),
      label: item.note ?? "", status: "UNAVAILABLE", calendarSourceId: item.calendarSourceId ?? undefined, externalEventId: item.externalEventId ?? undefined }));
    const result = syncResult(source.id, reconcileCalendarBlocks(source.id, next, ranges));
    const own = new Map(existing.filter((item) => item.calendarSourceId === source.id).map((item) => [item.externalEventId, item]));
    await tx.villaAvailabilityBlock.deleteMany({ where: { villaId: source.villaId, calendarSourceId: source.id,
      ...(next.length ? { externalEventId: { notIn: next.map((item) => item.externalEventId!) } } : {}) } });
    const added = next.filter((item) => !own.has(item.externalEventId!));
    if (added.length) await tx.villaAvailabilityBlock.createMany({ data: added.map((item) => ({ id: item.id, villaId: source.villaId,
      calendarSourceId: source.id, externalEventId: item.externalEventId, startsAt: new Date(`${item.startDate}T00:00:00Z`),
      endsAt: new Date(`${item.endDate}T00:00:00Z`), blockType: "UNAVAILABLE", note: item.label })) });
    for (const item of next) {
      const old = own.get(item.externalEventId!);
      if (old && (old.startsAt.toISOString().slice(0, 10) !== item.startDate || old.endsAt.toISOString().slice(0, 10) !== item.endDate || old.note !== item.label)) {
        await tx.villaAvailabilityBlock.update({ where: { id: old.id }, data: { startsAt: new Date(`${item.startDate}T00:00:00Z`), endsAt: new Date(`${item.endDate}T00:00:00Z`), note: item.label } });
      }
    }
    const now = new Date();
    await tx.calendarSyncSource.update({ where: { id: source.id }, data: { status: result.outcome === "WARNING" ? "WARNING" : "HEALTHY", lastSyncedAt: now,
      nextSyncAt: new Date(now.getTime() + CALENDAR_SYNC_INTERVAL_MS), syncLeaseToken: null, syncLeaseUntil: null } });
    await tx.calendarSyncLog.create({ data: { companyId: source.companyId, sourceId: source.id, villaId: source.villaId,
      channelName: source.channelName, outcome: result.outcome, eventCount: result.eventCount, message: result.message } });
    return result;
  }, { timeout: 30000 });
}

async function recordFailure(source: Source, token: string, message: string) {
  if (source.local) {
    await updateLocalCalendarState((state) => {
      const runtime = state.sources[source.id];
      if (runtime?.leaseToken !== token) return;
      Object.assign(runtime, { status: "ERROR", leaseToken: undefined, leaseUntil: undefined });
      state.logs.push({ id: randomUUID(), sourceId: source.id, companyId: source.companyId, villaSlug: source.villaSlug,
        villaTitle: source.villaTitle, channelName: source.channelName, outcome: "ERROR", eventCount: 0, message, createdAt: new Date().toISOString() });
    });
    return;
  }
  await db.$transaction(async (tx) => {
    const changed = await tx.calendarSyncSource.updateMany({ where: { id: source.id, syncLeaseToken: token }, data: { status: "ERROR", syncLeaseToken: null, syncLeaseUntil: null } });
    if (changed.count) await tx.calendarSyncLog.create({ data: { companyId: source.companyId, sourceId: source.id, villaId: source.villaId,
      channelName: source.channelName, outcome: "ERROR", eventCount: 0, message } });
  });
}

export async function synchronizeCalendarSource(sourceId: string, dueOnly = false): Promise<CalendarSyncResult | null> {
  const source = await loadSource(sourceId);
  assertSource(source);
  const token = randomUUID();
  if (!await claimSource(source, token, dueOnly)) {
    if (dueOnly) return null;
    throw new CalendarImportError("Bu kaynak zaten senkronize ediliyor veya yeni degisti. Biraz sonra tekrar deneyin.");
  }
  try {
    const text = await fetchRentalCalendar(source.sourceUrl);
    const events = parseRentalCalendar(text);
    return await applyCalendar(source, token, events);
  } catch (error) {
    const message = error instanceof CalendarImportError ? error.message : "Senkron kaydedilemedi; onceki doluluk korundu. Sunucu kayitlarini kontrol edin.";
    try { await recordFailure(source, token, message); } catch { console.error("Calendar sync failure could not be recorded", { sourceId }); }
    if (!(error instanceof CalendarImportError)) console.error("Calendar sync failed", { sourceId, errorType: error instanceof Error ? error.name : "Unknown" });
    throw new CalendarImportError(message);
  }
}

export async function runDueCalendarSyncs() {
  const now = new Date();
  const ids = await withDevelopmentFallback(async () => (await db.calendarSyncSource.findMany({ where: {
    active: true, direction: "IMPORT", company: { status: "ACTIVE" }, nextSyncAt: { lte: now },
    OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lte: now } }],
  }, orderBy: [{ nextSyncAt: "asc" }, { id: "asc" }], take: 10, select: { id: true } })).map((item) => item.id), async () => {
    const state = await readLocalCalendarState();
    const companies = new Set((await getFallbackCompanyRecords()).filter((item) => item.status === "ACTIVE").map((item) => item.id));
    return (await getFallbackIcalSources()).filter((item) => item.active && item.direction === "IMPORT" && companies.has(item.companyId!) &&
      !(Date.parse(state.sources[item.id]?.nextSyncAt ?? "") > now.getTime()) && !(Date.parse(state.sources[item.id]?.leaseUntil ?? "") > now.getTime()))
      .sort((a, b) => (a.nextSyncAt ?? "").localeCompare(b.nextSyncAt ?? "") || a.id.localeCompare(b.id)).slice(0, 10).map((item) => item.id);
  });
  const results: { sourceId: string; outcome: string; message?: string }[] = [];
  // Serial, bounded batches keep the worker's CPU, sockets and database use predictable.
  for (const sourceId of ids) {
    if (Date.now() - now.getTime() > 180000) break;
    try {
      const result = await synchronizeCalendarSource(sourceId, true);
      results.push(result ?? { sourceId, outcome: "SKIPPED" });
    } catch (error) {
      results.push({ sourceId, outcome: "ERROR", message: error instanceof CalendarImportError ? error.message : "Senkron servisi kullanilamiyor." });
    }
  }
  return { processed: results.length, failed: results.filter((item) => item.outcome === "ERROR").length, results };
}
