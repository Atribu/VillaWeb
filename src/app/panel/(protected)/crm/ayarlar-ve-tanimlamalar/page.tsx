import Link from "next/link";
import { getCustomerSegmentLabel, getReviewStatusLabel } from "@/lib/demo-crm";
import { getDemoCrmOverview, getDemoReviews } from "@/lib/server/demo-crm-store";

export const dynamic = "force-dynamic";

export default async function PanelCrmSettingsPage() {
  const [overview, reviews] = await Promise.all([getDemoCrmOverview(), getDemoReviews()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          CRM Ayarlari ve Tanimlamalar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kupon, kampanya, segment ve yorum akislarini ayni merkezden oku
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu ekran CRM omurgasinin genel kontrol katmani gibi davranir. Musteri segmentleri,
          yorum moderasyonu ve ticari aksiyonlarin ozetini tek bakista sunar.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {overview.summaryCards.map((card) => (
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f16824]">
            Segment Dagilimi
          </p>
          <div className="mt-6 space-y-4">
            {(Object.entries(overview.segmentDistribution) as Array<[keyof typeof overview.segmentDistribution, number]>).map(
              ([segment, count]) => {
                const width =
                  overview.customers.length > 0
                    ? `${Math.max((count / overview.customers.length) * 100, count > 0 ? 8 : 0)}%`
                    : "0%";

                return (
                  <div key={segment}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">
                        {getCustomerSegmentLabel(segment)}
                      </span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-900" style={{ width }} />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
            Yorum Moderasyon Ozeti
          </p>
          <div className="mt-6 space-y-4">
            {(["PUBLISHED", "PENDING", "HIDDEN"] as const).map((status) => (
              <div
                key={status}
                className="rounded-[1.2rem] border border-slate-100 bg-[#f8fafc] px-4 py-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {getReviewStatusLabel(status)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {reviews.filter((review) => review.status === status).length} yorum
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/panel/kuponlar", label: "Kupon yonetimine git" },
          { href: "/panel/indirimler", label: "Kampanya yonetimine git" },
          { href: "/panel/crm/musteriler", label: "Musteri havuzunu ac" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-[#2b78ad] hover:text-[#2b78ad]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
