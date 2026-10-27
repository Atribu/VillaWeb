import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getFallbackWebsites } from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { resolveSiteTemplate, selectCompanyWebsite } from "@/lib/site-templates";

// Request-local memoization only: never share a tenant's theme across requests.
export const getCurrentPublicSiteTemplate = cache(async () => {
  const company = await getCurrentPublicCompany();
  const host = (await headers()).get("host") ?? "";
  const websites = await withDevelopmentFallback(
    async () => (await db.companyWebsite.findMany({
      where: { companyId: company.id },
      select: { id: true, companyId: true, domain: true, isPrimary: true, themeKey: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })).map((site) => ({ ...site, default: site.isPrimary })),
    async () => (await getFallbackWebsites(company.id)).map((site) => ({ ...site, companyId: company.id, isPrimary: site.default, themeKey: site.themeKey ?? null })),
  );
  const website = selectCompanyWebsite(websites, company.id, host);
  return { company, websiteId: website?.id ?? null, themeKey: resolveSiteTemplate(website?.themeKey) };
});
