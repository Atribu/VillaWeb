import { OperationTasksManager } from "@/components/panel/operation-tasks-manager";
import { getDemoOperationTasks } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelCleaningOperationsPage() {
  const tasks = (await getDemoOperationTasks()).filter((task) => task.taskType === "CLEANING");

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Ev Temizlik
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Cikis sonrasi tum temizlik gorevlerini tek akista yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Onayli rezervasyonlardan gelen housekeeping gorevleri burada ekip bazinda durum
          guncelleyerek ilerletilir.
        </p>
      </div>

      <OperationTasksManager
        tasks={tasks}
        emptyMessage="Su an aktif temizlik gorevi bulunmuyor."
      />
    </div>
  );
}
