import { CalendarSourcesManager } from "@/components/panel/calendar-sources-manager";
import { getDemoIcalSources } from "@/lib/server/demo-calendar-sync-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelCalendarSourcesPage() {
  const [sources, villas] = await Promise.all([getDemoIcalSources(), getDemoVillas()]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          iCal Kaynaklari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Kanal bazli takvim kaynaklarini aktif olarak yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Her kaynak ilgili villa ve kanal baglantisini temsil eder. Manuel senkron butonu yeni
          log kaydi olusturur ve kaynak sagligini gunceller.
        </p>
      </div>

      <CalendarSourcesManager sources={sources} villas={villas} />
    </div>
  );
}
