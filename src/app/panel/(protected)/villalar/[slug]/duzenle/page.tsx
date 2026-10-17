import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Villa Duzenle
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
              {villa.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Temel bilgiler, fiyat, SEO metinleri, dil alanlari ve yayin durumu bu ekrandan
              guncellenir. Gorsel secmezsen mevcut galeri korunur.
            </p>
          </div>

          <Link
            href="/panel/villalar"
            className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
          >
            Villa Listesine Don
          </Link>
        </div>
      </div>

      <VillaEditorNavigation editing />
      <VillaForm key={villa.id} mode="edit" initialVilla={villa} regions={regions} />
      <div id="villa-periods" className="panel-section"><VillaPricingPeriodsManager villa={villa} /></div>
      <div id="villa-calendar" className="panel-section"><VillaAvailabilityManager key={JSON.stringify(villa.availabilityRanges)} villa={villa} /></div>
      <div id="villa-ical" className="panel-section"><VillaIcalExportCard icalPath={getVillaIcalPath(villa.companyId, villa.slug)} /></div>
    </div>
  );
}
