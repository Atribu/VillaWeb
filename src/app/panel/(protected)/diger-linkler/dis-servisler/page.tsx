import { ExternalServicesManager } from "@/components/panel/external-services-manager";
import { getDemoExternalServices } from "@/lib/server/demo-external-links-store";

export const dynamic = "force-dynamic";

export default async function PanelExternalServicesPage() {
  const services = await getDemoExternalServices();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Dis Servisler
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Harici dashboard ve servislerin saglik durumunu tek yerden izle
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          SEO, analitik ve iletisim araclari gibi dis servisler burada takip edilir.
        </p>
      </div>

      <ExternalServicesManager services={services} />
    </div>
  );
}
