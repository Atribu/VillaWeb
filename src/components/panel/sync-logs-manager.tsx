import {
  getSyncOutcomeLabel,
  getSyncOutcomeTone,
  type DemoSyncLogRecord,
} from "@/lib/demo-calendar-sync";
import { formatShortDate } from "@/lib/villa-catalog";

type SyncLogsManagerProps = {
  logs: DemoSyncLogRecord[];
};

export function SyncLogsManager({ logs }: SyncLogsManagerProps) {
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <article
          key={log.id}
          className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getSyncOutcomeTone(
                    log.outcome,
                  )}`}
                >
                  {getSyncOutcomeLabel(log.outcome)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {log.channelName}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{log.villaTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {formatShortDate(log.createdAt.slice(0, 10))} · {log.eventCount} blok islendi
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                {log.message}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
