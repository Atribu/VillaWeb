import { ParameterGroupsManager } from "@/components/panel/parameter-groups-manager";
import { getDemoParameterGroups } from "@/lib/server/demo-definitions-store";

export const dynamic = "force-dynamic";

export default async function PanelParameterGroupsPage() {
  const groups = await getDemoParameterGroups();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Parametre Gruplari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Vitrin, teklif ve operasyon akisinin ortak parametrelerini yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Filtreler, havuz tipleri ve servis paketleri gibi ortak grup yapilari bu ekranda tutulur.
        </p>
      </div>

      <ParameterGroupsManager groups={groups} />
    </div>
  );
}
