import { PricingManager } from "@/components/panel/pricing-manager";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelPricingPage() {
  const villas = await getDemoVillas();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Fiyatlandirma
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Baz fiyat, temizlik ucreti ve minimum gece kuralini her villa icin yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu ekrandaki kayitlar hem vitrin kartlarini hem villa detay fiyatini hem de talep
          formundaki toplam tutari etkiler.
        </p>
      </div>

      <PricingManager villas={villas} />
    </div>
  );
}
