import { platformPage } from "@/lib/server/platform-page";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { listPortfolioShares } from "@/lib/server/portfolio-sharing";
import { PortfolioSharing } from "@/components/panel/portfolio-sharing";
import { CompanyPicker } from "@/components/panel/platform-controls";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
export const dynamic = "force-dynamic";
export default async function SharingPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const context = await platformPage("sharing", (await searchParams).companyId);
  const villas = (await getDemoVillas({ companyId: context.company.id, includeMetrics: false })).filter(villa => villa.status === "ACTIVE");
  return <div className="work-stack"><PanelPageHeader eyebrow="İş ortakları" title="Portföy paylaşımı" description="Yalnızca seçtiğiniz villalar ve karşılıklı kabul edilen koşullar paylaşılır." /><CompanyPicker companies={context.companies} companyId={context.company.id} /><PortfolioSharing key={context.company.id} companyId={context.company.id} villas={villas.map(({ id, title }) => ({ id, title }))} shares={await listPortfolioShares(context.company.id)} /></div>;
}
