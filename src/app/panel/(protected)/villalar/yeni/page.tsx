import { VillaForm } from "@/components/panel/villa-form";
import { VillaEditorNavigation } from "@/components/panel/villa-editor-navigation";
import { getDemoRegionAirportRecords } from "@/lib/server/demo-definitions-store";

export const dynamic = "force-dynamic";

export default async function PanelNewVillaPage() {
  const regions = await getDemoRegionAirportRecords();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Yeni Villa Ekle
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Portfoyunuze yeni bir villa ekleyin
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Villa bilgilerini, fotograflari ve misafirlerin gorecegi detaylari doldurun.
          Ilk kayittan sonra fiyat donemlerini ve musaitlik takvimini yonetebilirsiniz.
        </p>
      </div>

      <VillaEditorNavigation />
      <VillaForm regions={regions} />
    </div>
  );
}
