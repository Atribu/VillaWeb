import { CurrencyRatesManager } from "@/components/panel/currency-rates-manager";
import { getDemoCurrencyRates } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelDefinitionCurrenciesPage() {
  const currencies = await getDemoCurrencyRates();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kurlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Sistem genelinde paylasilan kur tanimlarini bu ekrandan yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu ekran Ayarlar altindaki doviz kayitlariyla ayni veri kaynagini kullanir; amaci
          tanimlama katmaninda merkezi referans sunmaktir.
        </p>
      </div>

      <CurrencyRatesManager currencies={currencies} />
    </div>
  );
}
