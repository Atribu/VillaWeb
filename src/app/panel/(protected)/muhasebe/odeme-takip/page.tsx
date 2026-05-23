import { FinancePaymentsManager } from "@/components/panel/finance-payments-manager";
import { getDemoPayments } from "@/lib/server/demo-finance-store";

export const dynamic = "force-dynamic";

export default async function PanelFinancePaymentsPage() {
  const payments = await getDemoPayments();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Odeme Takip
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kapora ve kalan odeme planlarini tahsilat ekranindan yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Burada guncellenen tahsilat durumu otomatik olarak kasa hareketi ve bakiye ozetine
          yansitilir. Boylece ekip tek ekrandan aksiyon alip rapora ulasabilir.
        </p>
      </div>

      <FinancePaymentsManager payments={payments} />
    </div>
  );
}
