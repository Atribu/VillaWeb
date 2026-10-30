import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { RequestDetail } from "@/components/panel/request-detail";
import { RecordActivity } from "@/components/panel/record-activity";
import { getDemoRequestById, getDemoRequestEvents } from "@/lib/server/demo-operations-store";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { readPanelAudit } from "@/lib/server/panel-audit";
import { getRequestStatusLabel } from "@/lib/demo-operations";

export const dynamic = "force-dynamic";
export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const request = await getDemoRequestById((await params).id);
  if (!request) notFound();
  await assertPanelCompanyAccess(request.companyId);
  const [activity, events] = await Promise.all([readPanelAudit({ companyId: request.companyId, entityType: "REQUEST", entityId: request.id }), getDemoRequestEvents({ companyId: request.companyId })]);
  const firstTrackedStatus = activity.filter(item => item.action === "STATUS_CHANGED").map(item => item.createdAt).sort()[0];
  const timeline = [...activity, ...events.filter(item => item.requestId === request.id && (item.eventType === "CREATED" || !firstTrackedStatus || item.createdAt < firstTrackedStatus))
    .map(item => ({ id: `legacy-${item.id}`, action: item.eventType, summary: item.detail, actor: item.actorLabel, createdAt: item.createdAt }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
  return <div className="space-y-6"><PanelPageHeader eyebrow={`Talep / ${request.id}`} title={request.villaTitle} description={`${request.fullName} · ${getRequestStatusLabel(request.status)}`} actions={<Link href="/panel/talepler" className="panel-button-secondary">Taleplere dön</Link>} />
    <RequestDetail request={request} /><section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Notlar ve işlem geçmişi</h2><RecordActivity activity={timeline} /></section></div>;
}
