import { TeamUsersManager } from "@/components/panel/team-users-manager";
import { getDemoBranches, getDemoTeamUsers } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelStaffPage() {
  const [users, branches] = await Promise.all([getDemoTeamUsers(), getDemoBranches()]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kullanici Merkezi
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Personel, rol ve ekip yapisi artik panel icinden yonetilebilir durumda
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Demo ekip kayitlari bu ekranda aktiflik ve rol bazinda guncellenir. Acenta ve sube
          baglantilari diger kullanici modulleriyle ortak store uzerinden calisir.
        </p>
      </section>

      <TeamUsersManager users={users} branches={branches} />
    </div>
  );
}
