import "server-only";
import { headers } from "next/headers";
import { getUserSession } from "@/lib/auth/server-session";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { getCompanyRecordById } from "@/lib/server/company-store";
import { changePlatformConfig, readPlatformConfig, companyUsage } from "@/lib/server/company-platform";
import { parseSiteContent, type SiteContent } from "@/lib/platform-features";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { getDemoWebsites } from "@/lib/server/demo-websites-store";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";

export async function publicSiteContent(companyId: string) {
  const config = await readPlatformConfig(companyId);
  if ((await headers()).get("x-site-preview") === "1") {
    const actor = await getUserSession();
    if (actor && hasPermission(actor.role, "websites") && (actor.role === "SUPER_ADMIN" || actor.companyId === companyId)) {
      return { content: config.siteDraft ?? config.sitePublished, preview: true };
    }
  }
  return { content: config.sitePublished, preview: false };
}
export async function siteWorkspace(companyId: string) {
  await requirePanelPermission("websites"); await assertPanelCompanyAccess(companyId);
  const company = await getCompanyRecordById(companyId);
  if (!company) throw new PanelRecordError("Firma bulunamadı.", 404);
  const config = await readPlatformConfig(companyId);
  const website = (await getDemoWebsites()).find(site => site.companyId === companyId && site.default);
  const content: SiteContent = config.siteDraft ?? config.sitePublished ?? {
    themeKey: website?.themeKey ?? "secki", logoUrl: "", heroTitle: company.heroTitle,
    heroDescription: company.heroDescription, phone: company.phone === "-" ? "" : company.phone,
    email: company.email === "-" ? "" : company.email, address: company.address ?? "", whatsapp: company.whatsapp === "-" ? "" : company.whatsapp,
    domain: company.primaryDomain === "-" ? "" : company.primaryDomain,
  };
  return { company, config, content, usage: await companyUsage(companyId) };
}
export async function saveSiteDraft(companyId: string, version: number, value: unknown) {
  await requirePanelPermission("websites"); const content = parseSiteContent(value);
  return changePlatformConfig(companyId, version, async current => ({ ...current, siteDraft: content }));
}
export async function publishSiteDraft(companyId: string, version: number) {
  await requirePanelPermission("websites");
  return changePlatformConfig(companyId, version, async current => {
    if (!current.siteDraft) throw new PanelRecordError("Önce taslak kaydedin.");
    const content = parseSiteContent(current.siteDraft);
    if (!content.phone || !content.email || !content.address) throw new PanelRecordError("Yayın için telefon, e-posta ve adresi tamamlayın.");
    // Domain routing remains administrator-verified; a draft must never claim another host.
    return { ...current, sitePublished: content };
  });
}
