import {
  getRequestStatusLabel,
  type RequestStatus,
} from "@/lib/demo-operations";
import {
  buildDemoReports,
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoRequests,
} from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { formatCurrency } from "@/lib/villa-catalog";

export const dynamic = "force-dynamic";

export default async function PanelReportsPage() {
  const [villas, requests, coupons, discounts] = await Promise.all([
    getDemoVillas(),
    getDemoRequests(),
    getDemoCoupons(),
    getDemoDiscountCampaigns(),
  ]);
  const reports = buildDemoReports({
    villas,
    requests,
    coupons,
    discounts,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Raporlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Talepler, kuponlar ve gelir metrikleri ayni demo store uzerinden canli hesaplanir
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu sayfa public formdan gelen kayitlari, panelde degisen durumlari ve gecerli ticari
          kurallari bir araya getirerek ekip icin okunabilir operasyon ozetleri sunar.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {reports.summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            One Cikan Metrikler
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "En cok incelenen villa",
                value: reports.topMetrics.topViewedVilla?.title ?? "-",
                meta: `${reports.topMetrics.topViewedVilla?.viewCount ?? 0} goruntulenme`,
              },
              {
                label: "En cok talep alan villa",
                value: reports.topMetrics.topRequestedVilla?.title ?? "-",
                meta: `${reports.topMetrics.topRequestedVilla?.requestCount ?? 0} talep`,
              },
              {
                label: "En cok gelir getiren villa",
                value: reports.topMetrics.topRevenueVilla?.title ?? "-",
                meta: reports.topMetrics.topRevenueVilla?.revenueLabel ?? formatCurrency(0),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{item.value}</p>
                <p className="mt-3 text-sm text-slate-500">{item.meta}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.6rem] bg-slate-900 p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
              Kampanya Ozet
            </p>
            <p className="mt-4 text-3xl font-semibold">
              {reports.topMetrics.activeDiscountCount} aktif kampanya
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Aktif kampanyalar villalarin vitrin fiyatinda aninda gorunur ve uygun tarihlerde
              talep toplami hesaplamasina dahil edilir.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Durum Dagilimi
          </p>
          <div className="mt-6 space-y-4">
            {(Object.entries(reports.requestDistribution) as Array<[RequestStatus, number]>).map(
              ([status, count]) => {
                const width = requests.length > 0 ? `${(count / requests.length) * 100}%` : "0%";

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{getRequestStatusLabel(status)}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Villa Bazli Gelir Siralamasi
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-[var(--color-slate-soft)]">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Villa</th>
                  <th className="px-4 py-3 font-medium">Gelir</th>
                  <th className="px-4 py-3 font-medium">Talep</th>
                  <th className="px-4 py-3 font-medium">Goruntulenme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reports.revenueByVilla.map((villa) => (
                  <tr key={villa.villaSlug}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{villa.title}</td>
                    <td className="px-4 py-4 text-slate-600">{formatCurrency(villa.totalRevenue)}</td>
                    <td className="px-4 py-4 text-slate-600">{villa.totalRequests}</td>
                    <td className="px-4 py-4 text-slate-600">{villa.totalViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Son 6 Ay
          </p>
          <div className="mt-6 space-y-4">
            {reports.monthlyTrend.map((item) => {
              const width = requests.length > 0 ? `${Math.max(item.requestCount * 16, 8)}%` : "8%";

              return (
                <div key={item.monthKey} className="rounded-[1.4rem] bg-[var(--color-slate-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item.monthLabel}</span>
                    <span className="text-sm text-slate-500">{item.requestCount} talep</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-slate-900" style={{ width }} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Onayli gelir: {formatCurrency(item.approvedRevenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
