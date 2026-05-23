import { CustomersManager } from "@/components/panel/customers-manager";
import { getDemoCustomers } from "@/lib/server/demo-crm-store";

export const dynamic = "force-dynamic";

export default async function PanelCustomersPage() {
  const customers = await getDemoCustomers();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Musteriler
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Talep ve rezervasyonlardan beslenen musteri havuzunu segment bazinda yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Public form ve panel kayitlari ayni kisi havuzunda birlestirilir. Segment yapisi ticari
          potansiyeli ve tekrar rezervasyon ihtimalini hizli okumayi saglar.
        </p>
      </div>

      <CustomersManager customers={customers} />
    </div>
  );
}
