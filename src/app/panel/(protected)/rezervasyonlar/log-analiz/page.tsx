import {
  getRequestOriginLabel,
  getRequestStatusLabel,
} from "@/lib/demo-operations";
import {
  buildDemoReports,
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoRequestEvents,
  getDemoRequests,
} from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

export const dynamic = "force-dynamic";

export default async function PanelReservationLogPage() {
  const [requests, requestEvents, villas, coupons, discounts] = await Promise.all([
    getDemoRequests(),
    getDemoRequestEvents(),
    getDemoVillas(),
    getDemoCoupons(),
    getDemoDiscountCampaigns(),
  ]);
  const reports = buildDemoReports({
    villas,
    requests,
    coupons,
    discounts,
  });
  const recentEvents = requestEvents.slice(0, 10);
  const panelCreatedCount = requests.filter((request) => request.origin === "MANUAL_PANEL").length;
  const publicCreatedCount = requests.length - panelCreatedCount;
  const approvedCount = requests.filter((request) => request.status === "APPROVED").length;
  const conversionRate = requests.length > 0 ? Math.round((approvedCount / requests.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Log & Analiz
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Rezervasyon akisinin loglari ve ticari donusum sinyalleri burada toplanir
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Yeni kayitlar, durum degisimleri ve kanal kaynaklari ayni feed icinde izlenir. Bu ekran
          sonraki fazda daha derin operasyon loglariyla buyutulecek.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          {
            label: "Toplam olay",
            value: requestEvents.length,
            detail: "Kayit olusumu ve durum gecis loglari",
          },
          {
            label: "Panel kaynakli kayit",
            value: panelCreatedCount,
            detail: "Backoffice tarafindan acilan dosyalar",
          },
          {
            label: "Public kaynakli kayit",
            value: publicCreatedCount,
            detail: "Formdan gelen organik talepler",
          },
          {
            label: "Onay donusumu",
            value: `%${conversionRate}`,
            detail: `${approvedCount} kayit onayli rezervasyona donustu`,
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f16824]">
            Son Islem Gecmisi
          </p>
          <div className="mt-6 space-y-4">
            {recentEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.2rem] border border-slate-100 bg-[#f8fafc] px-5 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600">
                        {event.requestId}
                      </span>
                      <span>{event.villaTitle}</span>
                      <span>·</span>
                      <span>{getRequestOriginLabel(event.origin)}</span>
                      {event.status ? (
                        <>
                          <span>·</span>
                          <span>{getRequestStatusLabel(event.status)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <p>{formatShortDate(event.createdAt.slice(0, 10))}</p>
                    <p className="mt-1">{event.actorLabel}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
              Ticari Ozet
            </p>
            <div className="mt-5 space-y-4">
              {reports.summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.2rem] border border-slate-100 bg-[#f8fafc] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
              En Degerli Kanal
            </p>
            <div className="mt-5 rounded-[1.3rem] bg-slate-900 px-5 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Pipeline Hacmi
              </p>
              <p className="mt-3 text-3xl font-semibold">
                {reports.summaryCards[1]?.value ?? formatCurrency(0)}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Public akisin organik talepleri ile panelden acilan manuel kayitlar ayni ticari
                havuzda toplanir.
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
