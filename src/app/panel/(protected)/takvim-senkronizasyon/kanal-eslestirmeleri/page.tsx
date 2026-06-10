import { ChannelMappingsManager } from "@/components/panel/channel-mappings-manager";
import { getDemoChannelMappings } from "@/lib/server/demo-calendar-sync-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelChannelMappingsPage() {
  const [mappings, villas] = await Promise.all([getDemoChannelMappings(), getDemoVillas()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kanal Eslestirmeleri
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Villa takvimini kanal isimleriyle net sekilde eslestir
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Cift yonlu veya sadece ice aktarim modu burada belirlenir. Eslestirme durumu aktif veya
          pasif olarak panelden degistirilebilir.
        </p>
      </div>

      <ChannelMappingsManager mappings={mappings} villas={villas} />
    </div>
  );
}
