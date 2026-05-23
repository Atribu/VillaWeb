import { RolesMatrix } from "@/components/panel/roles-matrix";
import { getDemoRoles } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelRolesPage() {
  const roles = await getDemoRoles();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Roller
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Demo paneldeki rol ve yetki iskeletini ekip yogunluguyla birlikte gor
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Kullanici rolleri rezervasyon, operasyon, muhasebe ve villa yonetimi arasinda gorev
          dagilimini netlestirmek icin ayrildi.
        </p>
      </div>

      <RolesMatrix roles={roles} />
    </div>
  );
}
