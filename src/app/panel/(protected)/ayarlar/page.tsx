import Link from "next/link";
import {
  getDemoCacheGroups,
  getDemoCurrencyRates,
  getDemoDocuments,
  getDemoPaymentMethods,
  getDemoSystemDefaults,
} from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelSettingsOverviewPage() {
  const [currencies, methods, caches, documents, defaults] = await Promise.all([
    getDemoCurrencyRates(),
    getDemoPaymentMethods(),
    getDemoCacheGroups(),
    getDemoDocuments(),
    getDemoSystemDefaults(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Ayarlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Sistem, odeme ve operasyon varsayimlarini tek merkezden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Kur, tahsilat, cache ve ekip varsayimlari bu modulde toplanir. Yapilan degisiklikler
          panel operasyonunu destekleyen demo akisa aninda yansir.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          ["Aktif kur", String(currencies.filter((item) => item.status === "LIVE").length), "Canli kur kayitlari"],
          ["Odeme kanali", String(methods.filter((item) => item.status === "ACTIVE").length), "Aktif tahsilat yontemi"],
          ["Saglikli cache", String(caches.filter((item) => item.status === "HEALTHY").length), "Normal durumda olan cache gruplari"],
          ["Aktif dokuman", String(documents.filter((item) => item.status === "ACTIVE").length), "Ekip kullanimina acik dokumanlar"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Operasyon Ozeti
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Varsayilan sistem konfigürasyonu
              </h3>
            </div>
            <Link
              href="/panel/ayarlar/sistem-varsayilanlari"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Duzenle
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Talep geri donus", `${defaults.leadResponseMinutes} dk`],
              ["Varsayilan min gece", `${defaults.defaultMinNightCount} gece`],
              ["Temizlik hazirlik", `${defaults.defaultCleaningLeadHours} saat`],
              ["Varsayilan para birimi", defaults.defaultCurrency],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {label}
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Cache ve Dokumanlar
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Hizli bakis
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {caches.slice(0, 2).map((item) => (
              <div key={item.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-sm text-slate-500">{item.target}</p>
              </div>
            ))}
            {documents.slice(0, 2).map((item) => (
              <div key={item.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.category}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
