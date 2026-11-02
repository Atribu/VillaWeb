import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { getFallbackVillas, saveFallbackVilla } from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { withFallbackBookingMutation } from "@/lib/server/fallback-booking-workflow";
import { validatePricingPeriod, type PricingPeriodInput } from "@/lib/villa-pricing-periods";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { writePanelAudit } from "@/lib/server/panel-audit";
import { dateKey, decimalToNumber } from "@/lib/server/prisma-demo-shared";

export async function bulkPricing(companyId: string, ids: unknown, input: PricingPeriodInput, preview: boolean) {
  await requirePanelPermission("pricing"); await assertPanelCompanyAccess(companyId);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new PanelRecordError("Geçerli fiyat dönemi girin.");
  if (input.active === false) throw new PanelRecordError("Toplu işlem yalnızca etkin dönem oluşturur.");
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => typeof id !== "string") || new Set(ids).size !== ids.length) throw new PanelRecordError("1-100 villa seçin.");
  if (input.id) throw new PanelRecordError("Toplu işlem yalnızca yeni dönem ekler. Var olan dönemleri villa ekranından düzenleyin.");
  try { validatePricingPeriod(input, []); } catch (error) { throw new PanelRecordError((error as Error).message); }
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    const villas = await tx.villa.findMany({ where: { id: { in: ids }, companyId }, orderBy: { id: "asc" } });
    if (villas.length !== ids.length) throw new PanelRecordError("Seçimde erişilemeyen villa var.", 403);
    for (const villa of villas) await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villa.id} FOR UPDATE`;
    for (const villa of villas) {
      const rules = await tx.villaPricingRule.findMany({ where: { villaId: villa.id, ruleType: "SEASONAL" } });
      try { validatePricingPeriod(input, rules.map(rule => ({ id: rule.id, title: rule.title, startDate: dateKey(rule.startsAt), endDate: dateKey(rule.endsAt), nightlyPrice: decimalToNumber(rule.nightlyPrice), active: rule.isActive }))); }
      catch (error) { throw new PanelRecordError(`${villa.title}: ${(error as Error).message}`); }
    }
    if (!preview) for (const villa of villas) {
      await tx.villaPricingRule.create({ data: { villaId: villa.id, title: input.title, ruleType: "SEASONAL", startsAt: new Date(`${input.startDate}T00:00:00Z`), endsAt: new Date(`${input.endDate}T23:59:59.999Z`),
        nightlyPrice: input.nightlyPrice, minNightCount: input.minNightCount, weekendPercent: input.weekendPercent, earlyBookingDays: input.earlyBookingDays, earlyBookingPercent: input.earlyBookingPercent,
        cleaningFee: input.cleaningFee, isActive: true } });
      await writePanelAudit({ companyId, entityType: "VILLA", entityId: villa.id, action: "BULK_PRICING", summary: `${input.title}: ${input.startDate} - ${input.endDate}, ${input.nightlyPrice} TL/gece.` }, tx);
    }
    return { count: villas.length, preview, titles: villas.map(villa => villa.title) };
  }, { timeout: 20000 }), () => withFallbackBookingMutation(async () => {
    const villas = (await getFallbackVillas(companyId)).filter(villa => ids.includes(villa.id));
    if (villas.length !== ids.length) throw new PanelRecordError("Seçimde erişilemeyen villa var.", 403);
    for (const villa of villas) { try { validatePricingPeriod(input, villa.pricingPeriods ?? []); } catch (error) { throw new PanelRecordError(`${villa.title}: ${(error as Error).message}`); } }
    if (!preview) for (const villa of villas) await saveFallbackVilla({ ...villa, pricingPeriods: [...(villa.pricingPeriods ?? []), { ...input, id: randomUUID(), active: true }] });
    return { count: villas.length, preview, titles: villas.map(villa => villa.title) };
  }));
}
