import "server-only";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import type { PanelPermission } from "@/lib/auth/permissions";
import { PanelAccessError } from "@/lib/auth/access-error";

export async function platformPage(permission: PanelPermission, companyId?: string) {
  const actor = await requirePanelPermission(permission);
  const companies = (await getAllCompanyRecords()).filter(company => actor.role === "SUPER_ADMIN" || company.id === actor.companyId);
  const company = companies.find(item => item.id === companyId) ?? (!companyId ? companies[0] : undefined);
  if (!company) throw new PanelAccessError("Bu firma için yetkiniz bulunmuyor.");
  return { actor, companies: companies.map(({ id, name }) => ({ id, name })), company };
}
