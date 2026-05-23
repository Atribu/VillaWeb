import { CurrencyRatesManager } from "@/components/panel/currency-rates-manager";
import { getDemoCurrencyRates } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelCurrencyRatesPage() {
  const currencies = await getDemoCurrencyRates();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Doviz Kurlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kur kaynaklarini ve panel satis kurlarini yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Canli veya manuel girilen kur kayitlari bu ekrandan guncellenir. Satis ve alis degerleri
          ayrik tutulur.
        </p>
      </div>

      <CurrencyRatesManager currencies={currencies} />
    </div>
  );
}
