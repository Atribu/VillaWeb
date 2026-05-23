import { OperationTasksManager } from "@/components/panel/operation-tasks-manager";
import { getDemoOperationTasks } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelRemindersPage() {
  const tasks = (await getDemoOperationTasks()).filter((task) => task.taskType === "REMINDER");

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Hatirlaticilar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Misafir ve ekip hatirlaticilarini takvim oncesi guncelle
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Giriş oncesi teyit, konum gonderimi ve ekip bildirimleri icin olusturulan hatirlatici
          gorevleri buradan yonetilir.
        </p>
      </div>

      <OperationTasksManager
        tasks={tasks}
        emptyMessage="Su an planlanmis hatirlatici gorevi bulunmuyor."
      />
    </div>
  );
}
