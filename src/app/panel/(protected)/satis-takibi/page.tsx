import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { SalesBoard } from "@/components/panel/sales-board";
import { getSalesWorkspace } from "@/lib/server/panel-workspace";
export const dynamic = "force-dynamic";
export default async function SalesPage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const data = await getSalesWorkspace(); const params = await searchParams;
  return <div className="work-stack"><PanelPageHeader eyebrow="Rezervasyonlar" title="Satış takip panosu" description="Taleplerin aşamasını, sorumlusunu ve bir sonraki görüşmesini takip edin." /><SalesBoard {...data} initialRequest={params.request} /></div>;
}
