import { FinanceCashbookManager } from "@/components/panel/finance-cashbook-manager";
import { getDemoCashEntries } from "@/lib/server/demo-finance-store";

export const dynamic = "force-dynamic";

export default async function PanelFinanceCashbookPage() {
  const entries = await getDemoCashEntries();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kasa Takip
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Otomatik tahsilatlari ve manuel gider hareketlerini ayni kasada gor
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Tahsil edilen odemeler otomatik gelir kaydi uretir. Ihtiyac halinde manuel gider veya
          gelir ekleyerek backoffice kasa gorunumunu zenginlestirebilirsin.
        </p>
      </div>

      <FinanceCashbookManager entries={entries} />
    </div>
  );
}
