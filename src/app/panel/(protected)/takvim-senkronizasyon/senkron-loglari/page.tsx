import { SyncLogsManager } from "@/components/panel/sync-logs-manager";
import { getDemoSyncLogs } from "@/lib/server/demo-calendar-sync-store";

export const dynamic = "force-dynamic";

export default async function PanelSyncLogsPage() {
  const logs = await getDemoSyncLogs();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Senkron Loglari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Son takvim senkronlarinin sonucunu satir satir incele
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Basarili, uyari veya hata ile sonuclanan senkronlar burada saklanir. Manuel senkron
          islemleri de ayni log listesine dusurulur.
        </p>
      </div>

      <SyncLogsManager logs={logs} />
    </div>
  );
}
