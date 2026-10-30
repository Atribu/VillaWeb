import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import { PanelRecordError, validateBulkSelection, validateGalleryChange } from "@/lib/panel-record-tools";
import { withDevelopmentFallback, writeDevelopmentDataFile } from "@/lib/server/development-fallback";
import { getFallbackVillas } from "@/lib/server/development-fallback-data";
import { writePanelAudit } from "@/lib/server/panel-audit";
import { withFallbackBookingMutation } from "@/lib/server/fallback-booking-workflow";

export async function updateVillaGallery(id: string, input: unknown) {
  const companyId = await resolvePanelCompanyId();
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    const villa = await tx.villa.findFirst({ where: { id, ...(companyId ? { companyId } : {}) }, include: {
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    } });
    if (!villa) throw new PanelRecordError("Villa bulunamadı.", 404);
    await assertPanelCompanyAccess(villa.companyId);
    const current = { urls: villa.images.map(image => image.url), cover: villa.images.find(image => image.isCover)?.url ?? villa.coverImageUrl ?? villa.images[0]?.url ?? null };
    const next = validateGalleryChange(current, input);
    await tx.villaImage.deleteMany({ where: { villaId: id, url: { notIn: next.urls } } });
    // One parameterized update keeps large galleries out of an N-query loop.
    const ordering = JSON.stringify(next.urls.map((url, index) => ({ url, sort_index: index + 1 })));
    await tx.$executeRaw`UPDATE "VillaImage" AS image
      SET "sortOrder" = entry.sort_index, "isCover" = (image.url = ${next.cover}), "updatedAt" = NOW()
      FROM jsonb_to_recordset(${ordering}::jsonb) AS entry(url text, sort_index integer)
      WHERE image."villaId" = ${id} AND image.url = entry.url`;
    await tx.villa.update({ where: { id }, data: { coverImageUrl: next.cover } });
    await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: id, action: "GALLERY_UPDATED",
      summary: `Galeri düzenlendi: ${current.urls.length} → ${next.urls.length} fotoğraf. Kapak ${current.cover === next.cover ? "korundu" : "değiştirildi"}; sıralama kaydedildi.` }, tx);
    return { ...next, slug: villa.slug };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 }), () => withFallbackBookingMutation(async () => {
    const villas = await getFallbackVillas();
    const villa = villas.find(item => item.id === id && (!companyId || item.companyId === companyId));
    if (!villa) throw new PanelRecordError("Villa bulunamadı.", 404);
    await assertPanelCompanyAccess(villa.companyId);
    const next = validateGalleryChange({ urls: villa.imageUrls, cover: villa.coverImageUrl ?? villa.imageUrls[0] ?? null }, input);
    await writeDevelopmentDataFile("demo-villas.json", villas.map(item => item.id === id ? { ...item, imageUrls: next.urls, imageCount: next.urls.length, coverImageUrl: next.cover } : item));
    await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: id, action: "GALLERY_UPDATED",
      summary: `Galeri düzenlendi: ${villa.imageUrls.length} → ${next.urls.length} fotoğraf. Kapak ${villa.coverImageUrl === next.cover ? "korundu" : "değiştirildi"}; sıralama kaydedildi.` });
    return { ...next, slug: villa.slug };
  }));
}

export async function bulkUpdateVillaStatus(input: unknown) {
  const { selection, status } = validateBulkSelection(input);
  const ids = selection.map(item => item.id);
  const companyId = await resolvePanelCompanyId();
  async function validate(villas: { id: string; companyId: string; status: string }[]) {
    if (villas.length !== ids.length) throw new PanelRecordError("Seçimde erişilemeyen villa var. Hiçbir kayıt değiştirilmedi.", 403);
    for (const villa of villas) {
      await assertPanelCompanyAccess(villa.companyId);
      if (selection.find(item => item.id === villa.id)?.status !== villa.status) {
        throw new PanelRecordError("Bir villanın durumu değişmiş. Listeyi yenileyip tekrar seçin.", 409);
      }
    }
  }
  function log(villa: { id: string; companyId: string; status: string }) {
    return { companyId: villa.companyId, entityType: "VILLA" as const, entityId: villa.id, action: "BULK_STATUS_CHANGED",
      summary: `Toplu işlem: ${villa.status} → ${status}.` };
  }
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    const villas = await tx.villa.findMany({ where: { id: { in: ids }, ...(companyId ? { companyId } : {}) } });
    await validate(villas);
    await tx.villa.updateMany({ where: { id: { in: ids } }, data: { status } });
    for (const villa of villas) await writePanelAudit(log(villa), tx);
    return villas.map(villa => villa.slug);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 }), () => withFallbackBookingMutation(async () => {
    const all = await getFallbackVillas();
    const villas = all.filter(villa => ids.includes(villa.id) && (!companyId || villa.companyId === companyId));
    await validate(villas);
    await writeDevelopmentDataFile("demo-villas.json", all.map(villa => ids.includes(villa.id) ? { ...villa, status } : villa));
    for (const villa of villas) await writePanelAudit(log(villa));
    return villas.map(villa => villa.slug);
  }));
}
