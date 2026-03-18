import { dashboardStats, topVillaMetrics } from "@/lib/site-data";

export default function PanelDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <article
            key={item.label}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">{item.value}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
            Panel Omurgasi
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
            Yetki, fiyat, indirim ve talep yonetimi icin ilk dashboard iskeleti hazir
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Burasi sonraki adimlarda veritabani baglantisi, yetki kontrolu, rapor kartlari ve
            tablo bilesenleri ile canli hale getirilecek.
          </p>
        </div>

        <div className="space-y-4">
          {topVillaMetrics.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <p className="text-sm text-slate-500">{item.title}</p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{item.value}</h3>
              <p className="mt-2 text-sm text-slate-500">{item.meta}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
