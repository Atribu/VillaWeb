import { RegionAirportsManager } from "@/components/panel/region-airports-manager";
import { getDemoRegionAirportRecords } from "@/lib/server/demo-definitions-store";

export const dynamic = "force-dynamic";

export default async function PanelRegionAirportsPage() {
  const regions = await getDemoRegionAirportRecords();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Bolgeler ve Havaalanlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Villa bölgelerini transfer baglanti noktalarina gore standardize et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Lokasyon ust kirilimdir; bolgeler secili lokasyonun altinda tutulur. Villa eklerken once
          lokasyon, sonra bu lokasyona bagli bolge secilir.
        </p>
      </div>

      <RegionAirportsManager regions={regions} />
    </div>
  );
}
