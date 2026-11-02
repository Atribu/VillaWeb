import { platformPage } from "@/lib/server/platform-page";
import { readPlatformConfig, companyUsage } from "@/lib/server/company-platform";
import { CompanyPackageEditor } from "@/components/panel/company-package";
import { CompanyPicker } from "@/components/panel/platform-controls";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
export const dynamic = "force-dynamic";
export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const data = await platformPage("companies", (await searchParams).companyId);
  return <div className="work-stack"><PanelPageHeader eyebrow="Platform yönetimi" title="Firma paketleri" description="Kullanım sınırları ve modül erişimleri. Yalnızca süper admin değiştirebilir." /><CompanyPicker companies={data.companies} companyId={data.company.id} />
    <CompanyPackageEditor key={data.company.id} initial={await readPlatformConfig(data.company.id)} usage={await companyUsage(data.company.id)} /></div>;
}
