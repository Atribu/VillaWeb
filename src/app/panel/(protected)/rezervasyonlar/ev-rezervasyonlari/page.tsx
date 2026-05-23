import { ReservationListManager } from "@/components/panel/reservation-list-manager";
import { getDemoRequests } from "@/lib/server/demo-operations-store";

export const dynamic = "force-dynamic";

export default async function PanelReservationListPage() {
  const requests = await getDemoRequests();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Ev Rezervasyonlari
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Rezervasyon ve talep kayitlarini tek listeden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Panelden acilan kayitlar ile public formdan gelen talepler ayni akista izlenir. Durum
          guncellemeleri takvimi, raporlari ve villa doluluk planini ayni anda etkiler.
        </p>
      </div>

      <ReservationListManager requests={requests} />
    </div>
  );
}
