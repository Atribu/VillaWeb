import { DiscountsManager } from "@/components/panel/discounts-manager";
import {
  getDemoDiscountCampaigns,
} from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelDiscountsPage() {
  const [villas, discounts] = await Promise.all([getDemoVillas(), getDemoDiscountCampaigns()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Indirimler
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Zaman aralikli kampanyalar vitrinde eski fiyat ustu cizili sekilde calisir
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Aktif kampanyalar secilen tarih araligi uygunsa talep formundaki toplam hesaplamaya da
          dahil edilir.
        </p>
      </div>

      <DiscountsManager villas={villas} discounts={discounts} />
    </div>
  );
}
