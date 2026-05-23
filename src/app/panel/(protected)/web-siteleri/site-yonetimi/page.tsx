import { WebsitesManager } from "@/components/panel/websites-manager";
import { getDemoWebsites } from "@/lib/server/demo-websites-store";

export const dynamic = "force-dynamic";

export default async function PanelWebsiteManagementPage() {
  const websites = await getDemoWebsites();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Site Yonetimi
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Alan adlari ve yayin durumlarini panelden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Canli, staging veya duraklatilmis site kayitlari burada tutulur. Varsayilan site secimi
          de bu ekrandan degistirilebilir.
        </p>
      </div>

      <WebsitesManager websites={websites} />
    </div>
  );
}
