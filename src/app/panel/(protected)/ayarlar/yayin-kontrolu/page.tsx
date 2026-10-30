import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { PublicationManager } from "@/components/panel/publication-manager";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { getPublicationPolicy } from "@/lib/server/publication-policy";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { publicationChecks } from "@/lib/panel-workspace";
export const dynamic = "force-dynamic";
export default async function PublicationPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const actor = await requirePanelPermission("settings"); const params = await searchParams;
  const companies = (await getAllCompanyRecords()).filter(row => actor.role === "SUPER_ADMIN" || row.id === actor.companyId);
  const company = companies.find(row => row.id === params.companyId) ?? companies[0];
  if (!company) return <p>Firma bulunamadı.</p>;
  const policy = await getPublicationPolicy(company.id);
  const villas = (await getDemoVillas({ companyId: company.id, includeMetrics: false })).map(row => ({ id: row.id, title: row.title, slug: row.slug, status: row.status, missing: publicationChecks(row, policy.required).filter(check => !check.passed) }));
  return <div className="work-stack"><PanelPageHeader eyebrow="Ayarlar" title="Villa yayın kontrolü" description="Eksik içerikleri görün ve firmanız için ek yayın kurallarını belirleyin." />{companies.length > 1 && <form className="work-toolbar"><label>Firma<select name="companyId" defaultValue={company.id}>{companies.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><button className="panel-button-secondary">Göster</button></form>}<PublicationManager companyId={company.id} {...policy} villas={villas} /></div>;
}
