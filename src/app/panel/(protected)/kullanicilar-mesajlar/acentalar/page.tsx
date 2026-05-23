import { AgenciesManager } from "@/components/panel/agencies-manager";
import { getDemoAgencies } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelAgenciesPage() {
  const agencies = await getDemoAgencies();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Acentalar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kanal ve partner yapisini canli metriklerle izle
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Direkt web, merkez ekip ve partner acentalar ayni ekranda gorunur. Public ve manuel
          rezervasyon akislari kanal bazinda bu listeye yansitilir.
        </p>
      </div>

      <AgenciesManager agencies={agencies} />
    </div>
  );
}
