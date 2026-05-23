import { LandingPagesManager } from "@/components/panel/landing-pages-manager";
import { getDemoLandingPages } from "@/lib/server/demo-websites-store";

export const dynamic = "force-dynamic";

export default async function PanelLandingPagesPage() {
  const landings = await getDemoLandingPages();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Landing Sayfalari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Bölge ve kampanya bazli landing backlogunu durum bazinda ilerlet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Her landing kaydinda hedef bolge, keyword ve lead durumu bir arada tutulur.
        </p>
      </div>

      <LandingPagesManager landings={landings} />
    </div>
  );
}
