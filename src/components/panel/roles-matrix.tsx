import type { DemoRoleRecord } from "@/lib/demo-users-messages";

type RolesMatrixProps = {
  roles: DemoRoleRecord[];
};

export function RolesMatrix({ roles }: RolesMatrixProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {roles.map((role) => (
        <article
          key={role.id}
          className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2b78ad]">
                {role.id}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">{role.label}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{role.description}</p>
            </div>

            <div className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Kullanici
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{role.userCount}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {role.permissionGroups.map((group) => (
              <span
                key={group}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {group}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
