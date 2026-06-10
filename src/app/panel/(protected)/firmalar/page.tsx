import { redirect } from "next/navigation";
import { CompanyManagementManager } from "@/components/panel/company-management-manager";
import { getUserSession } from "@/lib/auth/server-session";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import { getDemoBranches, getDemoTeamUsers } from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/panel/giris");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/panel");
  }

  const [companies, users, branches] = await Promise.all([
    getAllCompanyRecords(),
    getDemoTeamUsers(),
    getDemoBranches(),
  ]);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.8rem] border border-[#d8e0e7] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2b78ad]">
          Platform Firmalari
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#334155]">
          Super admin icin firma, iletisim ve firma kullanicisi yonetimi tek ekranda
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          Bu ekranda yeni firma kaydi acabilir, adres ve vergi bilgilerini duzenleyebilir, ilgili
          domain bilgisini guncelleyebilir ve her firmanin kullanicilarini dogrudan super admin
          yetkisiyle yonetebilirsin.
        </p>
      </div>

      <CompanyManagementManager companies={companies} users={users} branches={branches} />
    </section>
  );
}
