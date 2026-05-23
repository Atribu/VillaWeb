import { InternalMessagesManager } from "@/components/panel/internal-messages-manager";
import { getDemoInternalMessages } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelMessagesPage() {
  const messages = await getDemoInternalMessages();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Mesajlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Ekip ici aksiyonlari ve geri donusleri durum bazinda yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Muhasebe, operasyon ve CRM tarafindan gelen ic iletiler bu ekranda toplanir. Durum
          guncellemeleri ile bekleyen ve kapanan aksiyonlar ayristirilir.
        </p>
      </div>

      <InternalMessagesManager messages={messages} />
    </div>
  );
}
