import "server-only";
import { mutateFallbackRecord } from "@/lib/server/fallback-mutations";
import * as fallbackRecords from "@/lib/server/development-fallback-data";

import type {
  DemoLandingStatus,
  DemoSeoContentStatus,
} from "@/lib/demo-websites";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth/server-session";
import { canManageWebsite, parseWebsiteUpdate, resolveSiteTemplate, type WebsiteUpdate } from "@/lib/site-templates";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import {
  getFallbackLandingPages,
  getFallbackSeoContents,
  getFallbackWebsites,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback, writeDevelopmentDataFile } from "@/lib/server/development-fallback";
import {
  mapDemoWebsiteStatusToPrisma,
  mapSeoStatusToDemo,
  mapWebsiteStatusToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoWebsitesStoreError extends Error {}
export class WebsiteAccessError extends Error {}
export class WebsiteNotFoundError extends Error {}

function mapSeoContentTypeToDemo(type: "BLOG" | "LANDING" | "CATEGORY" | "PAGE") {
  return type === "PAGE" ? ("CATEGORY" as const) : type;
}

export async function getDemoWebsites() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const websites = await db.companyWebsite.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });

      return websites.map((website) => ({
        id: website.id,
        companyId: website.companyId,
        name: website.name,
        domain: website.domain ?? "",
        locale: website.locale,
        status: mapWebsiteStatusToDemo(website.status),
        primaryChannel: website.primaryChannel ?? "SEO + Direkt Talep",
        default: website.isPrimary,
        themeKey: resolveSiteTemplate(website.themeKey),
        updatedAt: website.updatedAt.toISOString(),
      }));
    },
    async () => (await getFallbackWebsites(await resolvePanelCompanyId())).map((website) => ({ ...website, themeKey: resolveSiteTemplate(website.themeKey) })),
  );
}

export async function getDemoLandingPages() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const landings = await db.landingPage.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: { updatedAt: "desc" },
      });

      return landings.map((landing) => ({
        id: landing.id,
        companyId: landing.companyId,
        title: landing.title,
        slug: landing.slug,
        targetRegion: landing.targetRegion ?? "-",
        focusKeyword: landing.focusKeyword ?? "-",
        status: landing.status,
        leadCount: landing.leadCount,
        updatedAt: landing.updatedAt.toISOString(),
      }));
    },
    async () => getFallbackLandingPages(await resolvePanelCompanyId()),
  );
}

export async function getDemoSeoContents() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const contents = await db.seoContent.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: { updatedAt: "desc" },
      });

      return contents.map((content) => ({
        id: content.id,
        companyId: content.companyId,
        title: content.title,
        contentType: mapSeoContentTypeToDemo(content.contentType),
        targetUrl: content.targetUrl,
        primaryKeyword: content.primaryKeyword,
        status: mapSeoStatusToDemo(content.status),
        seoScore: content.seoScore ?? 0,
        updatedAt: content.updatedAt.toISOString(),
      }));
    },
    async () => getFallbackSeoContents(await resolvePanelCompanyId()),
  );
}

export async function updateDemoWebsite(
  websiteId: string,
  input: WebsiteUpdate,
) {
  const session = await getUserSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) throw new WebsiteAccessError("Site yönetimi yetkiniz bulunmuyor.");
  const update = parseWebsiteUpdate(input);
  const authorize = (companyId: string) => {
    if (!canManageWebsite(session.role, session.companyId, companyId)) throw new WebsiteAccessError("Bu site için yetkiniz bulunmuyor.");
  };
  await withDevelopmentFallback(
    async () => {
      const website = await db.companyWebsite.findUnique({ where: { id: websiteId }, select: { id: true, companyId: true } });
      if (!website) throw new WebsiteNotFoundError("Site kaydı bulunamadı.");
      authorize(website.companyId);
      await db.$transaction(async (tx) => {
        if (update.default) {
          await tx.companyWebsite.updateMany({ where: { companyId: website.companyId }, data: { isPrimary: false } });
        }
        await tx.companyWebsite.update({
          where: { id: websiteId, companyId: website.companyId },
          data: {
            status: update.status ? mapDemoWebsiteStatusToPrisma(update.status) : undefined,
            isPrimary: update.default,
            themeKey: update.themeKey,
          },
        });
      });
    },
    async () => {
      const websites = await getFallbackWebsites();
      const website = websites.find((site) => site.id === websiteId);
      if (!website?.companyId) throw new WebsiteNotFoundError("Site kaydı bulunamadı.");
      authorize(website.companyId);
      await writeDevelopmentDataFile("demo-websites.json", websites.map((site) => {
        if (site.id === websiteId) return { ...site, ...update, updatedAt: new Date().toISOString() };
        return update.default && site.companyId === website.companyId ? { ...site, default: false } : site;
      }));
    },
  );
  const websites = await getDemoWebsites();
  return websites.find((item) => item.id === websiteId) ?? null;
}

export async function updateDemoLandingPage(
  landingId: string,
  input: {
    status: DemoLandingStatus;
  },
) {
  return withDevelopmentFallback(async () => {
    const landing = await db.landingPage.findUnique({
      where: { id: landingId },
      select: { id: true, companyId: true },
    });

    if (!landing) {
      throw new DemoWebsitesStoreError("Landing sayfasi bulunamadi.");
    }

    await assertPanelCompanyAccess(landing.companyId);

    await db.landingPage.update({
      where: { id: landingId },
      data: { status: input.status },
    });

    const landings = await getDemoLandingPages();
    return landings.find((item) => item.id === landingId) ?? null;
  }, async () => {

    return (await mutateFallbackRecord("demo-landing-pages.json", fallbackRecords.getFallbackLandingPages, landingId, (record) => ({ ...record, ...input, updatedAt: new Date().toISOString() })))!;
  });
}

export async function updateDemoSeoContent(
  contentId: string,
  input: {
    status?: DemoSeoContentStatus;
    seoScore?: number;
  },
) {
  return withDevelopmentFallback(async () => {
    const content = await db.seoContent.findUnique({
      where: { id: contentId },
      select: { id: true, companyId: true },
    });

    if (!content) {
      throw new DemoWebsitesStoreError("SEO icerigi bulunamadi.");
    }

    await assertPanelCompanyAccess(content.companyId);

    await db.seoContent.update({
      where: { id: contentId },
      data: {
        status: input.status ?? undefined,
        seoScore: input.seoScore ?? undefined,
      },
    });

    const contents = await getDemoSeoContents();
    return contents.find((item) => item.id === contentId) ?? null;
  }, async () => {

    return (await mutateFallbackRecord("demo-seo-contents.json", fallbackRecords.getFallbackSeoContents, contentId, (record) => ({ ...record, ...input, updatedAt: new Date().toISOString() })))!;
  });
}
