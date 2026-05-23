import { OperationFollowupBoard } from "@/components/panel/operation-followup-board";
import { getDemoRequests, getDemoOperationTasks } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelHomeFollowupPage() {
  const [requests, tasks] = await Promise.all([getDemoRequests(), getDemoOperationTasks()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Ev Takip
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Onaylanan rezervasyonlarin operasyon ilerlemesini villa bazinda takip et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu ekran, takvimi bloke edilen rezervasyonlarin arkasindaki operasyon görevlerini tek
          bir ilerleme akisi olarak gosterir.
        </p>
      </div>

      <OperationFollowupBoard requests={requests} tasks={tasks} />
    </div>
  );
}
