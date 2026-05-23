import { CommissionRatesManager } from "@/components/panel/commission-rates-manager";
import { getDemoCommissionRates } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelCommissionRatesPage() {
  const commissions = await getDemoCommissionRates();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Komisyon Oranlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kanal, sube ve ekip prim oranlarini ayni merkezden kontrol et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu oranlar demo sistemde acenta ve ekip bazli ticari senaryolari temsil eder. Gerektiginde
          oran veya aktiflik durumu panelden degistirilebilir.
        </p>
      </div>

      <CommissionRatesManager commissions={commissions} />
    </div>
  );
}
