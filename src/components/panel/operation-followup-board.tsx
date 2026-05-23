import Link from "next/link";
import { getRequestStatusLabel, type DemoRequest } from "@/lib/demo-operations";
import {
  getOperationTaskStatusLabel,
  type DemoOperationTask,
} from "@/lib/demo-operations-workflow";
import { formatShortDate } from "@/lib/villa-catalog";

type OperationFollowupBoardProps = {
  requests: DemoRequest[];
  tasks: DemoOperationTask[];
};

export function OperationFollowupBoard({ requests, tasks }: OperationFollowupBoardProps) {
  const approvedRequests = requests.filter((request) => request.status === "APPROVED");

  return (
    <div className="space-y-5">
      {approvedRequests.map((request) => {
        const requestTasks = tasks.filter((task) => task.requestId === request.id);
        const doneCount = requestTasks.filter((task) => task.status === "DONE").length;
        const progressPercent =
          requestTasks.length > 0 ? Math.round((doneCount / requestTasks.length) * 100) : 0;
        const nextTask =
          requestTasks
            .filter((task) => task.status !== "DONE" && task.status !== "CANCELLED")
            .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate))[0] ?? null;

        return (
          <article
            key={request.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    {getRequestStatusLabel(request.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {request.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{request.villaTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {request.fullName} · {request.guestCount} misafir
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatShortDate(request.checkIn)} - {formatShortDate(request.checkOut)}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["Toplam gorev", `${requestTasks.length}`],
                    ["Tamamlanan", `${doneCount}`],
                    ["Ilerleme", `%${progressPercent}`],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-[320px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Siradaki Gorev
                </p>
                {nextTask ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{nextTask.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatShortDate(nextTask.scheduledDate)} · {nextTask.scheduledTimeLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{nextTask.assignee}</p>
                    <p className="mt-3 rounded-[1rem] bg-white px-4 py-3 text-sm text-slate-600">
                      Durum:{" "}
                      <span className="font-semibold text-slate-900">
                        {getOperationTaskStatusLabel(nextTask.status)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    Bu rezervasyon icin acik operasyon gorevi kalmadi.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/panel/takip-operasyon/ev-operasyon"
                    className="rounded-full bg-[#2b78ad] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#215d86]"
                  >
                    Operasyon Merkezi
                  </Link>
                  <Link
                    href={`/villalar/${request.villaSlug}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#2b78ad] hover:text-[#2b78ad]"
                  >
                    Public Ac
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {approvedRequests.length === 0 ? (
        <div className="rounded-[1.7rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
          Henuz operasyon takibine gecmis onayli rezervasyon bulunmuyor.
        </div>
      ) : null}
    </div>
  );
}
