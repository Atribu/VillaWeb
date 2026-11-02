import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { readPlatformLocal, mutatePlatformLocal } from "@/lib/server/platform-local";
import { getDemoRequests } from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { isDateKey, todayInTurkey, shiftDateKey } from "@/lib/booking-dates";
import { trafficSource, rate, type TrafficSource } from "@/lib/platform-features";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { getPublicSharedVillas } from "@/lib/server/portfolio-sharing";

type Visit = { id: string; companyId: string; villaId: string; sessionHash: string; day: string; source: string };
export async function recordVisit(companyId: string, villaId: string, sessionId: string, source: TrafficSource) {
  const day = todayInTurkey(); const cutoff = shiftDateKey(day, -90);
  const sessionHash = createHash("sha256").update(`${companyId}:${day}:${sessionId}`).digest("hex");
  await withDevelopmentFallback(async () => {
    await db.funnelVisit.upsert({ where: { companyId_villaId_sessionHash_day: { companyId, villaId, sessionHash, day } }, update: {}, create: { companyId, villaId, sessionHash, day, source } });
    // Indexed, bounded retention: only expired anonymous visit rows are removed.
    await db.funnelVisit.deleteMany({ where: { companyId, day: { lt: cutoff } } });
  }, () => mutatePlatformLocal<Visit, void>("funnel-visits", rows => {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].day < cutoff) rows.splice(i, 1);
    if (!rows.some(row => row.companyId === companyId && row.villaId === villaId && row.sessionHash === sessionHash && row.day === day)) rows.push({ id: randomUUID(), companyId, villaId, sessionHash, day, source });
  }));
}
export async function conversionReport(companyId: string, start: string, end: string, source?: string) {
  await requirePanelPermission("reports"); await assertPanelCompanyAccess(companyId);
  if (!isDateKey(start) || !isDateKey(end) || start > end || start < shiftDateKey(todayInTurkey(), -90) || end > todayInTurkey()) throw new PanelRecordError("Son 90 gün içinde geçerli bir aralık seçin.");
  const visits = await withDevelopmentFallback(() => db.funnelVisit.findMany({ where: { companyId, day: { gte: start, lte: end }, ...(source ? { source: trafficSource(source) } : {}) } }),
    async () => (await readPlatformLocal<Visit>("funnel-visits")).filter(row => row.companyId === companyId && row.day >= start && row.day <= end && (!source || row.source === trafficSource(source))));
  const requests = (await getDemoRequests({ companyId })).filter(row => todayInTurkey(new Date(row.createdAt)) >= start && todayInTurkey(new Date(row.createdAt)) <= end && (!source || (row.channelLabel ?? (row.origin === "MANUAL_PANEL" ? "PANEL" : "UNKNOWN")) === source));
  const villas: { id: string; title: string; slug: string }[] = [
    ...await getDemoVillas({ companyId, includeMetrics: false }), ...await getPublicSharedVillas(companyId),
  ];
  for (const request of requests) {
    if (!villas.some(villa => villa.slug === request.villaSlug)) villas.push({
      id: request.sourceVillaId ?? request.villaSlug, slug: request.villaSlug, title: request.villaTitle,
    });
  }
  const rows = villas.map(villa => {
    const viewed = visits.filter(row => row.villaId === villa.id).length;
    const leads = requests.filter(row => row.villaSlug === villa.slug);
    const approved = leads.filter(row => row.status === "APPROVED").length;
    return { id: villa.id, title: villa.title, views: viewed, inquiries: leads.length, approved,
      viewToInquiry: rate(leads.filter(row => row.origin !== "MANUAL_PANEL").length, viewed), inquiryToBooking: rate(approved, leads.length) };
  });
  return { rows, totalViews: visits.length, totalRequests: requests.length, totalApproved: requests.filter(row => row.status === "APPROVED").length };
}
