import "server-only";

import { db } from "@/lib/db";
import type { DemoCompanyRecord } from "@/lib/demo-companies";

function mapCompanyToDemoRecord(company: {
  id: string;
  slug: string;
  publicName: string;
  shortName: string | null;
  panelName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  whatsappNumber: string | null;
  supportHours: string | null;
  primaryDomain: string | null;
  settings: {
    accentLabel: string | null;
    heroTitle: string | null;
    heroDescription: string | null;
  } | null;
}) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.publicName,
    shortName: company.shortName ?? company.publicName,
    panelLabel: company.panelName ?? `${company.publicName} Panel`,
    tagline: company.settings?.accentLabel ?? "Villa platformu",
    phone: company.primaryPhone ?? "-",
    whatsapp: company.whatsappNumber ?? company.primaryPhone ?? "-",
    email: company.primaryEmail ?? "-",
    primaryDomain: company.primaryDomain ?? "-",
    supportHours: company.supportHours ?? "-",
    accentLabel: company.settings?.accentLabel ?? "Firma bazli villa platformu",
    heroTitle: company.settings?.heroTitle ?? company.publicName,
    heroDescription:
      company.settings?.heroDescription ??
      "Villa vitrini, panel yonetimi ve operasyon akislarini tek merkezden yonetin.",
  } satisfies DemoCompanyRecord;
}

export async function getAllCompanyRecords() {
  const companies = await db.company.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      settings: {
        select: {
          accentLabel: true,
          heroTitle: true,
          heroDescription: true,
        },
      },
    },
  });

  return companies.map(mapCompanyToDemoRecord);
}

export async function getCompanyRecordById(companyId?: string | null) {
  if (!companyId) {
    return null;
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      settings: {
        select: {
          accentLabel: true,
          heroTitle: true,
          heroDescription: true,
        },
      },
    },
  });

  return company ? mapCompanyToDemoRecord(company) : null;
}

export async function getCompanyRecordBySlug(companySlug?: string | null) {
  if (!companySlug) {
    return null;
  }

  const company = await db.company.findUnique({
    where: { slug: companySlug.trim().toLowerCase() },
    include: {
      settings: {
        select: {
          accentLabel: true,
          heroTitle: true,
          heroDescription: true,
        },
      },
    },
  });

  return company ? mapCompanyToDemoRecord(company) : null;
}

export async function getDefaultCompanyRecord() {
  const company = await db.company.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      settings: {
        select: {
          accentLabel: true,
          heroTitle: true,
          heroDescription: true,
        },
      },
    },
  });

  return company ? mapCompanyToDemoRecord(company) : null;
}
