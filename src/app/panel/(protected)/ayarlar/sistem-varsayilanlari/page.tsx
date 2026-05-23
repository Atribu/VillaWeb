import { SystemDefaultsForm } from "@/components/panel/system-defaults-form";
import { getDemoSystemDefaults } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelSystemDefaultsPage() {
  const defaults = await getDemoSystemDefaults();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Sistem Varsayilanlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Talep, temizlik ve destek akisinin temel parametrelerini guncelle
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu alan backoffice tarafindaki operasyon varsayimlarini tek merkezden duzenlemek icin
          kullanilir.
        </p>
      </div>

      <SystemDefaultsForm defaults={defaults} />
    </div>
  );
}
