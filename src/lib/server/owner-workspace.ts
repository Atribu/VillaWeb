import "server-only";
import { randomUUID } from "node:crypto";
import { PanelAccessError } from "@/lib/auth/access-error";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { getFallbackVillas, saveFallbackVilla } from "@/lib/server/development-fallback-data";
import { withFallbackBookingMutation } from "@/lib/server/fallback-booking-workflow";
import { getWorkspaceTeam, validateAssignee } from "@/lib/server/panel-workspace";
import { changeWorkRecord, listWorkRecords, requirePanelPermission } from "@/lib/server/panel-work-records";
import { validStay, requiredText, optionalText } from "@/lib/panel-workspace";
import { todayInTurkey } from "@/lib/booking-dates";

async function scopedVilla(id: string) {
  const villa = (await getDemoVillas({ includeMetrics: false })).find(row => row.id === id);
  if (!villa) throw new PanelRecordError("Villa bulunamadı.", 404);
  return villa;
}
export async function getOwnerManagement() {
  await requirePanelPermission("users");
  const villas = await getDemoVillas({ includeMetrics: false });
  return { villas: villas.map(({ id, companyId, title }) => ({ id, companyId, title })),
    owners: (await getWorkspaceTeam()).filter(row => row.role === "OWNER"), access: await listWorkRecords("OWNER_ACCESS"), requests: await listWorkRecords("OWNER_REQUEST") };
}
export async function assignOwner(input: Record<string, unknown>) {
  await requirePanelPermission("users");
  const villa = await scopedVilla(requiredText(input.villaId, "Villa"));
  if (typeof input.active !== "boolean") throw new PanelRecordError("Erişim durumu zorunlu.");
  const userId = requiredText(input.userId, "Villa sahibi");
  const owner = input.active ? await validateAssignee(villa.companyId, userId, true) : null;
  return changeWorkRecord({ kind: "OWNER_ACCESS", companyId: villa.companyId, subjectId: `${userId}:${villa.id}`, version: input.version as number ?? 0 }, async current => {
    if (!input.active && (!current || current.userId !== userId || current.data.villaId !== villa.id)) throw new PanelRecordError("Erişim kaydı bulunamadı.", 404);
    return { userId, data: { villaId: villa.id, active: input.active, ownerName: owner?.name ?? current?.data.ownerName ?? "", villaTitle: villa.title } };
  });
}
export async function getOwnerWorkspace() {
  const actor = await requirePanelPermission("owner");
  const grants = (await listWorkRecords("OWNER_ACCESS", actor.companyId, actor.id)).filter(row => row.data.active === true);
  const ids = new Set(grants.map(row => row.data.villaId));
  // Only explicitly projected fields leave the server; no guests, prices or supplier notes.
  const villas = (await getDemoVillas({ includeMetrics: false })).filter(row => ids.has(row.id)).map(row => ({
    id: row.id, title: row.title, status: row.status, image: row.coverImageUrl ?? "", location: row.locationLabel,
    ranges: row.availabilityRanges.map(range => ({ startDate: range.startDate, endDate: range.endDate, status: range.status })),
  }));
  const requests = (await listWorkRecords("OWNER_REQUEST", actor.companyId, actor.id)).filter(row => ids.has(row.data.villaId));
  return { villas, requests };
}
export async function requestOwnerClosure(input: Record<string, unknown>) {
  const actor = await requirePanelPermission("owner");
  const villaId = requiredText(input.villaId, "Villa");
  const grant = (await listWorkRecords("OWNER_ACCESS", actor.companyId, actor.id)).find(row => row.data.villaId === villaId && row.data.active === true);
  if (!grant) throw new PanelAccessError();
  const villa = await scopedVilla(villaId);
  const dates = validStay(input.startDate, input.endDate);
  if (dates.startDate < todayInTurkey()) throw new PanelRecordError("Geçmiş tarih için talep oluşturulamaz.");
  const reason = optionalText(input.reason, 500);
  if (villa.availabilityRanges.some(row => dates.startDate < row.endDate && dates.endDate > row.startDate)) throw new PanelRecordError("Bu tarihler zaten kapalı.", 409);
  return changeWorkRecord({ kind: "OWNER_REQUEST", companyId: villa.companyId, subjectId: randomUUID(), version: 0 }, async () => ({ userId: actor.id,
    data: { ...dates, reason, status: "PENDING", villaId, villaTitle: villa.title, ownerName: actor.displayName } }));
}
export async function reviewOwnerClosure(input: Record<string, unknown>) {
  const actor = await requirePanelPermission("users");
  const request = (await listWorkRecords("OWNER_REQUEST")).find(row => row.id === input.id);
  if (!request) throw new PanelRecordError("Talep bulunamadı.", 404);
  if (!["APPROVED", "REJECTED"].includes(String(input.status))) throw new PanelRecordError("Geçersiz karar.");
  if (!Number.isInteger(input.version)) throw new PanelRecordError("Kayıt sürümü gerekli. Sayfayı yenileyin.", 409);
  const grant = (await listWorkRecords("OWNER_ACCESS", request.companyId, request.userId!)).find(row => row.data.villaId === request.data.villaId && row.data.active === true);
  if (input.status === "APPROVED" && !grant) throw new PanelRecordError("Villa sahibinin erişimi kaldırılmış. Talebi reddedebilirsiniz.", 409);
  return changeWorkRecord({ kind: "OWNER_REQUEST", companyId: request.companyId, subjectId: request.subjectId, version: input.version as number }, async (current, tx) => {
    if (!current || current.data.status !== "PENDING") throw new PanelRecordError("Talep zaten sonuçlanmış.", 409);
    const { startDate, endDate } = validStay(current.data.startDate, current.data.endDate);
    const villaId = String(current.data.villaId);
    if (input.status === "APPROVED") {
      if (startDate < todayInTurkey()) throw new PanelRecordError("Talep geçmiş tarihe ait.");
      if (tx) {
        const currentGrant = await tx.panelWorkRecord.findUnique({ where: { companyId_kind_subjectId: { companyId: request.companyId, kind: "OWNER_ACCESS", subjectId: `${request.userId}:${villaId}` } } });
        if (!currentGrant || (currentGrant.data as Record<string, unknown>).active !== true) throw new PanelRecordError("Villa sahibinin erişimi kaldırılmış.", 409);
        await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villaId} FOR UPDATE`;
        const villa = await tx.villa.findFirst({ where: { id: villaId, companyId: request.companyId } });
        if (!villa) throw new PanelRecordError("Villa bulunamadı.", 404);
        const startsAt = new Date(`${startDate}T00:00:00Z`), endsAt = new Date(`${endDate}T00:00:00Z`);
        const overlap = await tx.villaAvailabilityBlock.findFirst({ where: { villaId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
        if (overlap) throw new PanelRecordError("Tarihler başka bir kayıtla çakışıyor. Onaylanmadı.", 409);
        await tx.villaAvailabilityBlock.create({ data: { id: `owner-${request.id}`, villaId, startsAt, endsAt, blockType: "OWNER_STAY", note: "Villa sahibi kullanımı", createdByUserId: actor.id } });
      } else await withFallbackBookingMutation(async () => {
        const villa = (await getFallbackVillas(request.companyId)).find(row => row.id === villaId);
        if (!villa) throw new PanelRecordError("Villa bulunamadı.", 404);
        if (villa.availabilityRanges.some(row => startDate < row.endDate && endDate > row.startDate)) throw new PanelRecordError("Tarihler çakışıyor. Onaylanmadı.", 409);
        await saveFallbackVilla({ ...villa, availabilityRanges: [...villa.availabilityRanges, { id: `owner-${request.id}`, startDate, endDate, status: "UNAVAILABLE", label: "Villa sahibi kullanımı" }] });
      });
    }
    return { userId: current.userId, data: { ...current.data, status: input.status, reviewedBy: actor.displayName, reviewedAt: new Date().toISOString() } };
  });
}
