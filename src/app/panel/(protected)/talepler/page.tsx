import { RequestsManager } from "@/components/panel/requests-manager";
import { getDemoRequests } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelRequestsPage() {
  const requests = await getDemoRequests();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Talep Yonetimi
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Public formdan gelen talepler burada canli olarak yonetiliyor
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Talep durumu bu ekranda degistikce raporlar, villa ilgisi ve ticari pipeline metrikleri
          ayni demo verisi uzerinden guncellenir.
        </p>
      </div>

      <RequestsManager requests={requests} />
    </div>
  );
}
