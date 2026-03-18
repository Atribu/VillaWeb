import { CouponsManager } from "@/components/panel/coupons-manager";
import { getDemoCoupons } from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelCouponsPage() {
  const [villas, coupons] = await Promise.all([getDemoVillas(), getDemoCoupons()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Kupon Kodlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Kod, oran ve kullanim limiti olan kuponlar public talep formunda aktif sekilde kullanilir
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Buradaki her kupon denendiginde tarih ve villa uyumu kontrol edilir; basarili kullanim
          sayisi panel raporlarina otomatik yansir.
        </p>
      </div>

      <CouponsManager villas={villas} coupons={coupons} />
    </div>
  );
}
