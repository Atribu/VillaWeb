import { FinanceInvoicesManager } from "@/components/panel/finance-invoices-manager";
import { getDemoInvoices } from "@/lib/server/demo-finance-store";

export const dynamic = "force-dynamic";

export default async function PanelFinanceInvoicesPage() {
  const invoices = await getDemoInvoices();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Faturalar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Onayli rezervasyonlardan otomatik olusan faturalar uzerinde calis
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Fatura durumu guncellemeleri tahsilat akisiyla birlikte ilerler. Bu ekran daha cok
          yonetsel onay ve ticari takip adimi icin kullanilir.
        </p>
      </div>

      <FinanceInvoicesManager invoices={invoices} />
    </div>
  );
}
