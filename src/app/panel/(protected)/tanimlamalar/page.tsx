import Link from "next/link";
import { getDemoRegionAirportRecords, getDemoParameterGroups } from "@/lib/server/demo-definitions-store";
import { getDemoCurrencyRates } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelDefinitionsOverviewPage() {
  const [regions, groups, currencies] = await Promise.all([
    getDemoRegionAirportRecords(),
    getDemoParameterGroups(),
    getDemoCurrencyRates(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Tanimlamalar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Bölge, parametre ve kur standardizasyonunu tek merkezde topla
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Villa operasyonunun arka planinda kullandigi temel referans listeleri bu modulde yer alir.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          ["Bolge kaydi", String(regions.length), "Transfer ve lokasyon referanslari"],
          ["Parametre grubu", String(groups.length), "Villa ve teklif akisi sabitleri"],
          ["Kur kaydi", String(currencies.length), "Paylasilan para birimi kayitlari"],
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Bolgeler
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Transfer ve destinasyon referanslari
              </h3>
            </div>
            <Link
              href="/panel/tanimlamalar/bolgeler-ve-havaalanlari"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Listeyi Ac
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {regions.slice(0, 3).map((region) => (
              <div key={region.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{region.regionLabel}</p>
                <p className="mt-2 text-sm text-slate-500">{region.airportName}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Parametreler
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Liste ve filtre sabitleri
              </h3>
            </div>
            <Link
              href="/panel/tanimlamalar/parametre-gruplari"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Gruplari Ac
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {groups.slice(0, 3).map((group) => (
              <div key={group.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{group.label}</p>
                <p className="mt-2 text-sm text-slate-500">{group.scope}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
