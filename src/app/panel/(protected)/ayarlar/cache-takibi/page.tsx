import { CacheGroupsManager } from "@/components/panel/cache-groups-manager";
import { getDemoCacheGroups } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelCacheTrackingPage() {
  const groups = await getDemoCacheGroups();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Cache Takibi
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Public ve SEO onbellek gruplarini durum bazinda takip et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Buradaki warm islemi demo ortaminda yeni isitma zamani yazar ve cache grubunu saglikli
          duruma ceker.
        </p>
      </div>

      <CacheGroupsManager groups={groups} />
    </div>
  );
}
