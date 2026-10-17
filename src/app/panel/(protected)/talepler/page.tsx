import { RequestsManager } from "@/components/panel/requests-manager";
import { getDemoRequests } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const requests = await getDemoRequests();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Talep Yonetimi
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Talepler ve rezervasyon onaylari
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Misafir taleplerini inceleyin, tarihleri onaylayin ve odeme sonrasi konfirmasyon belgesini paylasin.
        </p>
      </div>

      <RequestsManager key={q ?? ""} requests={requests} initialQuery={q} />
    </div>
  );
}
