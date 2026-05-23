import { PaymentMethodsManager } from "@/components/panel/payment-methods-manager";
import { getDemoPaymentMethods } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelPaymentSystemPage() {
  const methods = await getDemoPaymentMethods();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Odeme Sistemi
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Tahsilat kanallarini ve komisyon oranlarini panelden kontrol et
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Her odeme yonteminin aktiflik durumu ve maliyet seviyesi burada takip edilir.
        </p>
      </div>

      <PaymentMethodsManager methods={methods} />
    </div>
  );
}
