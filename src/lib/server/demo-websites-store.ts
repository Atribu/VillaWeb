import "server-only";

import type {
  DemoLandingStatus,
  DemoSeoContentStatus,
  DemoWebsiteStatus,
} from "@/lib/demo-websites";
import { db } from "@/lib/db";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import {
  mapDemoWebsiteStatusToPrisma,
  mapSeoStatusToDemo,
  mapWebsiteStatusToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoWebsitesStoreError extends Error {}

function mapSeoContentTypeToDemo(type: "BLOG" | "LANDING" | "CATEGORY" | "PAGE") {
  return type === "PAGE" ? ("CATEGORY" as const) : type;
}

export async function getDemoWebsites() {
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
    updatedAt: website.updatedAt.toISOString(),
  }));
}

export async function getDemoLandingPages() {
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
}

export async function getDemoSeoContents() {
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
}

export async function updateDemoWebsite(
  websiteId: string,
  input: {
    status?: DemoWebsiteStatus;
    default?: boolean;
  },
) {
  const website = await db.companyWebsite.findUnique({
    where: { id: websiteId },
    select: { id: true, companyId: true },
  });

  if (!website) {
    throw new DemoWebsitesStoreError("Site kaydi bulunamadi.");
  }

  await assertPanelCompanyAccess(website.companyId);

  await db.$transaction(async (tx) => {
    if (input.default) {
      await tx.companyWebsite.updateMany({
        where: { companyId: website.companyId },
        data: { isPrimary: false },
      });
    }

    await tx.companyWebsite.update({
      where: { id: websiteId },
      data: {
        status: input.status ? mapDemoWebsiteStatusToPrisma(input.status) : undefined,
        isPrimary: input.default ?? undefined,
      },
    });
  });

  const websites = await getDemoWebsites();
  return websites.find((item) => item.id === websiteId) ?? null;
}

export async function updateDemoLandingPage(
  landingId: string,
  input: {
    status: DemoLandingStatus;
  },
) {
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
}

export async function updateDemoSeoContent(
  contentId: string,
  input: {
    status?: DemoSeoContentStatus;
    seoScore?: number;
  },
) {
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
}
