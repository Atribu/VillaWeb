import { BranchesManager } from "@/components/panel/branches-manager";
import { getDemoBranches } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelBranchesPage() {
  const branches = await getDemoBranches();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Subeler
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Saha ekiplerini ve bagli kanal performansini sube bazinda takip et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Her sube kaydi aktif kullanici sayisini, kanal talebini ve bagli acenta bilgisini tek
          kartta toplar.
        </p>
      </div>

      <BranchesManager branches={branches} />
    </div>
  );
}
