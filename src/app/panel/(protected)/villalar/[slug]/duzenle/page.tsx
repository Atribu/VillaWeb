import Link from "next/link";
import { getUserSession } from "@/lib/auth/server-session";
import { villaDraftKey } from "@/lib/villa-draft";
import { getPublicationPolicy } from "@/lib/server/publication-policy";
import { VillaGalleryManager } from "@/components/panel/villa-gallery-manager";
import { RecordActivity } from "@/components/panel/record-activity";
import { readPanelAudit } from "@/lib/server/panel-audit";
import { notFound } from "next/navigation";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { VillaForm } from "@/components/panel/villa-form";
import { VillaPricingPeriodsManager } from "@/components/panel/villa-pricing-periods-manager";
import { VillaIcalExportCard } from "@/components/panel/villa-ical-export-card";
import { VillaAvailabilityManager } from "@/components/panel/villa-availability-manager";
import { VillaEditorNavigation } from "@/components/panel/villa-editor-navigation";
import { getDemoRegionAirportRecords } from "@/lib/server/demo-definitions-store";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import { getVillaIcalPath } from "@/lib/server/villa-ical";

export const dynamic = "force-dynamic";

type PanelEditVillaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PanelEditVillaPage({ params }: PanelEditVillaPageProps) {
  const { slug } = await params;
  const [villa, regions] = await Promise.all([
    getDemoVillaBySlug(slug, { includeMetrics: false }),
    getDemoRegionAirportRecords(),
  ]);

  if (!villa) {
    notFound();
  }
  const session = await getUserSession();
  if (!session) return null;
  const activity = await readPanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id });
  const policy = await getPublicationPolicy(villa.companyId);

  return (
    <div className="space-y-6">
      <PanelPageHeader eyebrow={`Portföy / ${villa.shortCode || "Villa düzenle"}`} title={villa.title}
        description="İçerik, fotoğraf ve yayın bilgilerini yönetin. Yeni fotoğraf seçmezseniz mevcut galeri korunur."
        actions={<Link href="/panel/villalar" className="panel-button-secondary">Listeye dön</Link>} />
      <div className="panel-editor-layout">
        <VillaEditorNavigation editing />
        <div className="min-w-0 space-y-6">
          <VillaForm key={villa.id} mode="edit" initialVilla={villa} regions={regions} companyId={villa.companyId} publicationRequired={policy.required} draftKey={villaDraftKey(session.id, villa.companyId, villa.id)} />
          <VillaGalleryManager key={`${villa.id}:${JSON.stringify(villa.imageUrls)}:${villa.coverImageUrl}`} villaId={villa.id} initial={{ urls: villa.imageUrls, cover: villa.coverImageUrl ?? villa.imageUrls[0] ?? null }} />
          <p className="border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">Fiyat dönemleri ve müsaitlik değişiklikleri aşağıdaki bölümlerin kendi düğmeleriyle ayrı kaydedilir.</p>
          <div id="villa-periods" className="panel-section"><VillaPricingPeriodsManager villa={villa} /></div>
          <div id="villa-calendar" className="panel-section"><VillaAvailabilityManager key={JSON.stringify(villa.availabilityRanges)} villa={villa} /></div>
          <div id="villa-ical" className="panel-section"><VillaIcalExportCard icalPath={getVillaIcalPath(villa.companyId, villa.slug)} /></div>
          <section id="villa-history" className="panel-section rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Değişiklik geçmişi</h2><RecordActivity activity={activity} /></section>
        </div>
      </div>
    </div>
  );
}
