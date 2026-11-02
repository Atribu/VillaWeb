import { platformPage } from "@/lib/server/platform-page";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { AdvancedPricing } from "@/components/panel/advanced-pricing";
import { CompanyPicker } from "@/components/panel/platform-controls";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
export const dynamic = "force-dynamic";
export default async function PricingCalendarPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const context = await platformPage("pricing", (await searchParams).companyId);
  const villas = await getDemoVillas({ companyId: context.company.id, includeMetrics: false });
  return <div className="work-stack"><PanelPageHeader eyebrow="Gelir yönetimi" title="Fiyat takvimi" description="Seçili villalara tarih aralığı, hafta sonu farkı ve erken rezervasyon kuralları tanımlayın." /><CompanyPicker companies={context.companies} companyId={context.company.id} /><AdvancedPricing key={context.company.id} companyId={context.company.id} villas={villas.map(({ id, title }) => ({ id, title }))} /></div>;
}
