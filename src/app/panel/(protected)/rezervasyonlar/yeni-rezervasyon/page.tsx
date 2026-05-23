import { ManualReservationForm } from "@/components/panel/manual-reservation-form";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelNewReservationPage() {
  const villas = await getDemoVillas();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Yeni Rezervasyon
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Panel icinden manuel rezervasyon ve talep kaydi ac
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Buradan telefon, WhatsApp, acenta ya da manuel operasyon kayitlarini dogrudan sisteme
          acabilirsin. Secilen durum onayli ise villa takvimi otomatik olarak bloke edilir.
        </p>
      </div>

      <ManualReservationForm villas={villas} />
    </div>
  );
}
