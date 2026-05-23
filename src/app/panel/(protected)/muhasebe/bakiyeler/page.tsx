import { FinanceBalancesManager } from "@/components/panel/finance-balances-manager";
import { getDemoFinanceBalances } from "@/lib/server/demo-finance-store";

export const dynamic = "force-dynamic";

export default async function PanelFinanceBalancesPage() {
  const balances = await getDemoFinanceBalances();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Bakiyeler
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Rezervasyon bazli acik ve kapali bakiyeleri hizli filtrele
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Her onayli rezervasyon icin kontrat, tahsil edilen tutar ve kalan bakiye ayni kartta
          izlenir. Odeme durumu degistiginde bu liste de otomatik guncellenir.
        </p>
      </div>

      <FinanceBalancesManager balances={balances} />
    </div>
  );
}
