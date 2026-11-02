import { platformPage } from "@/lib/server/platform-page";
import { siteWorkspace } from "@/lib/server/site-publication";
import { SiteSetup } from "@/components/panel/site-setup";
import { CompanyPicker } from "@/components/panel/platform-controls";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
export const dynamic = "force-dynamic";
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const context = await platformPage("websites", (await searchParams).companyId);
  const data = await siteWorkspace(context.company.id);
  return <div className="work-stack"><PanelPageHeader eyebrow="Firma başlangıcı" title="Kurulum ve site yayını" description="Markanızı hazırlayın, taslağı inceleyin ve kontrollü yayınlayın." />
    <CompanyPicker companies={context.companies} companyId={data.company.id} /><SiteSetup key={data.company.id} companyId={data.company.id} companySlug={data.company.slug} content={data.content} initialConfig={data.config} users={data.usage.users} currentDomain={data.company.primaryDomain === "-" ? "" : data.company.primaryDomain} /></div>;
}
