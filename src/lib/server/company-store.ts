import "server-only";

import type { CompanyStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { DemoCompanyRecord, DemoCompanyStatus } from "@/lib/demo-companies";
import {
  createFallbackCompany,
  getFallbackCompanyRecordById,
  getFallbackCompanyRecordBySlug,
  getFallbackCompanyRecords,
  getFallbackDefaultCompanyRecord,
  updateFallbackCompany,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { assertSuperAdminPanelAccess } from "@/lib/server/demo-company-context";

export class DemoCompanyStoreError extends Error {}

type CompanyMutationInput = {
  publicName: string;
  legalName: string;
  shortName?: string;
  panelName?: string;
  primaryEmail?: string;
  primaryPhone: string;
  whatsappNumber?: string;
  primaryDomain?: string;
  address: string;
  taxNumber: string;
  status?: DemoCompanyStatus;
};

function mapCompanyToDemoRecord(company: {
  id: string;
  slug: string;
  legalName: string;
  publicName: string;
  shortName: string | null;
  panelName: string | null;
  status: CompanyStatus;
  primaryEmail: string | null;
  primaryPhone: string | null;
  whatsappNumber: string | null;
  supportHours: string | null;
  primaryDomain: string | null;
  taxNumber: string | null;
  settings: {
    address: string | null;
    accentLabel: string | null;
    heroTitle: string | null;
    heroDescription: string | null;
  } | null;
}) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.publicName,
    legalName: company.legalName,
    shortName: company.shortName ?? company.publicName,
    panelLabel: company.panelName ?? `${company.publicName} Panel`,
    status: company.status,
    tagline: company.settings?.accentLabel ?? "Villa platformu",
    phone: company.primaryPhone ?? "-",
    whatsapp: company.whatsappNumber ?? company.primaryPhone ?? "-",
    email: company.primaryEmail ?? "-",
    primaryDomain: company.primaryDomain ?? "-",
    address: company.settings?.address ?? "",
    taxNumber: company.taxNumber ?? "",
    supportHours: company.supportHours ?? "-",
    accentLabel: company.settings?.accentLabel ?? "Firma bazli villa platformu",
    heroTitle: company.settings?.heroTitle ?? company.publicName,
    heroDescription:
      company.settings?.heroDescription ??
      "Villa vitrini, panel yonetimi ve operasyon akislarini tek merkezden yonetin.",
  } satisfies DemoCompanyRecord;
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new DemoCompanyStoreError(`${label} zorunludur.`);
  }

  return normalized;
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function normalizeOptionalEmail(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  if (!normalized.includes("@")) {
    throw new DemoCompanyStoreError("Gecerli bir e-posta adresi girilmelidir.");
  }

  return normalized;
}

function normalizeOptionalDomain(value?: string) {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "") ?? "";

  return normalized || null;
}

function normalizeTaxNumber(value: string) {
  const normalized = value.trim();
  const digitsOnly = normalized.replace(/\D/g, "");

  if (!normalized) {
    throw new DemoCompanyStoreError("Vergi numarasi zorunludur.");
  }

  if (digitsOnly.length < 8) {
    throw new DemoCompanyStoreError("Vergi numarasi en az 8 haneli olmalidir.");
  }

  return normalized;
}

function normalizeCompanyStatus(status?: DemoCompanyStatus) {
  return status ?? "ACTIVE";
}

function slugifyCompanyName(value: string) {
  const normalized = value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "firma";
}

function buildUniqueSlug(baseName: string, existingSlugs: string[]) {
  const baseSlug = slugifyCompanyName(baseName);
  const usedSlugs = new Set(existingSlugs.map((slug) => slug.trim().toLowerCase()));

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function buildCompanyDefaults(publicName: string) {
  return {
    accentLabel: `${publicName} icin coklu firma villa vitrini`,
    heroTitle: `${publicName} ile secili villa deneyimini kesfedin.`,
    heroDescription: `${publicName} icin villa vitrini, panel yonetimi ve operasyon akislarini tek merkezden yonetin.`,
    supportHours: "Hafta ici 09:00 - 18:00",
  };
}

function normalizeCompanyInput(input: CompanyMutationInput) {
  const publicName = normalizeRequiredText(input.publicName, "Firma adi");
  const legalName = normalizeRequiredText(input.legalName, "Firma unvani");
  const primaryPhone = normalizeRequiredText(input.primaryPhone, "Telefon numarasi");
  const address = normalizeRequiredText(input.address, "Adres");
  const taxNumber = normalizeTaxNumber(input.taxNumber);

  return {
    publicName,
    legalName,
    shortName: normalizeOptionalText(input.shortName) ?? publicName,
    panelName: normalizeOptionalText(input.panelName) ?? `${publicName} Panel`,
    primaryEmail: normalizeOptionalEmail(input.primaryEmail),
    primaryPhone,
    whatsappNumber: normalizeOptionalText(input.whatsappNumber) ?? primaryPhone,
    primaryDomain: normalizeOptionalDomain(input.primaryDomain),
    address,
    taxNumber,
    status: normalizeCompanyStatus(input.status),
  };
}

async function getDbCompaniesForUniqueness() {
  return db.company.findMany({
    select: {
      id: true,
      slug: true,
      primaryDomain: true,
    },
  });
}

function assertUniqueDomain(
  companies: Array<{ id: string; primaryDomain: string | null }>,
  primaryDomain: string | null,
  excludeCompanyId?: string,
) {
  if (!primaryDomain) {
    return;
  }

  const hasDuplicate = companies.some(
    (company) =>
      company.id !== excludeCompanyId &&
      (company.primaryDomain ?? "").trim().toLowerCase() === primaryDomain,
  );

  if (hasDuplicate) {
    throw new DemoCompanyStoreError("Bu domain baska bir firma tarafindan kullaniliyor.");
  }
}

export async function getAllCompanyRecords() {
  return withDevelopmentFallback(
    async () => {
      const companies = await db.company.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          settings: {
            select: {
              address: true,
              accentLabel: true,
              heroTitle: true,
              heroDescription: true,
            },
          },
        },
      });

      return companies.map(mapCompanyToDemoRecord);
    },
    () => getFallbackCompanyRecords(),
  );
}

export async function getCompanyRecordById(companyId?: string | null) {
  if (!companyId) {
    return null;
  }

  return withDevelopmentFallback(
    async () => {
      const company = await db.company.findUnique({
        where: { id: companyId },
        include: {
          settings: {
            select: {
              address: true,
              accentLabel: true,
              heroTitle: true,
              heroDescription: true,
            },
          },
        },
      });

      return company ? mapCompanyToDemoRecord(company) : null;
    },
    () => getFallbackCompanyRecordById(companyId),
  );
}

export async function getCompanyRecordBySlug(companySlug?: string | null) {
  if (!companySlug) {
    return null;
  }

  return withDevelopmentFallback(
    async () => {
      const company = await db.company.findUnique({
        where: { slug: companySlug.trim().toLowerCase() },
        include: {
          settings: {
            select: {
              address: true,
              accentLabel: true,
              heroTitle: true,
              heroDescription: true,
            },
          },
        },
      });

      return company ? mapCompanyToDemoRecord(company) : null;
    },
    () => getFallbackCompanyRecordBySlug(companySlug),
  );
}

export async function getDefaultCompanyRecord() {
  return withDevelopmentFallback(
    async () => {
      const company = await db.company.findFirst({
        orderBy: { createdAt: "asc" },
        include: {
          settings: {
            select: {
              address: true,
              accentLabel: true,
              heroTitle: true,
              heroDescription: true,
            },
          },
        },
      });

      return company ? mapCompanyToDemoRecord(company) : null;
    },
    () => getFallbackDefaultCompanyRecord(),
  );
}

export async function createDemoCompany(input: CompanyMutationInput) {
  await assertSuperAdminPanelAccess();

  const normalized = normalizeCompanyInput(input);
  const defaults = buildCompanyDefaults(normalized.publicName);

  return withDevelopmentFallback(
    async () => {
      const companies = await getDbCompaniesForUniqueness();
      assertUniqueDomain(companies, normalized.primaryDomain);

      const slug = buildUniqueSlug(
        normalized.publicName,
        companies.map((company) => company.slug),
      );

      const createdCompanyId = await db.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            slug,
            legalName: normalized.legalName,
            publicName: normalized.publicName,
            shortName: normalized.shortName,
            panelName: normalized.panelName,
            status: normalized.status as CompanyStatus,
            primaryEmail: normalized.primaryEmail,
            primaryPhone: normalized.primaryPhone,
            whatsappNumber: normalized.whatsappNumber,
            supportHours: defaults.supportHours,
            primaryDomain: normalized.primaryDomain,
            taxNumber: normalized.taxNumber,
          },
          select: { id: true },
        });

        await tx.companySetting.create({
          data: {
            companyId: company.id,
            siteName: normalized.publicName,
            primaryPhone: normalized.primaryPhone,
            primaryEmail: normalized.primaryEmail,
            address: normalized.address,
            whatsappNumber: normalized.whatsappNumber,
            accentLabel: defaults.accentLabel,
            heroTitle: defaults.heroTitle,
            heroDescription: defaults.heroDescription,
          },
        });

        await tx.companyWebsite.create({
          data: {
            companyId: company.id,
            name: `${normalized.publicName} Ana Site`,
            slug: "ana-site",
            domain: normalized.primaryDomain,
            locale: "tr-TR",
            isPrimary: true,
            status: "STAGING",
            primaryChannel: "Direkt Talep",
            brandHeadline: defaults.heroTitle,
            metaTitle: `${normalized.publicName} | Villa Kiralama`,
            metaDescription: defaults.heroDescription,
            themeKey: "marketplace-core",
          },
        });

        const agency = await tx.agency.create({
          data: {
            companyId: company.id,
            name: "Merkez Operasyon",
            kind: "INTERNAL",
            ownerName: "Super Admin",
            city: normalized.address,
            note: "Yeni firma ile birlikte olusan varsayilan merkez operasyon kaydi.",
          },
          select: { id: true, name: true },
        });

        await tx.branch.create({
          data: {
            companyId: company.id,
            agencyId: agency.id,
            name: "Ana Sube",
            city: normalized.address,
            phone: normalized.primaryPhone,
          },
        });

        return company.id;
      });

      return await getCompanyRecordById(createdCompanyId);
    },
    async () => {
      const companies = await getFallbackCompanyRecords();
      assertUniqueDomain(
        companies.map((company) => ({
          id: company.id,
          primaryDomain: company.primaryDomain || null,
        })),
        normalized.primaryDomain,
      );

      return createFallbackCompany({
        ...normalized,
        primaryEmail: normalized.primaryEmail ?? "",
        primaryDomain: normalized.primaryDomain ?? "",
        slug: buildUniqueSlug(
          normalized.publicName,
          companies.map((company) => company.slug),
        ),
        supportHours: defaults.supportHours,
        accentLabel: defaults.accentLabel,
        heroTitle: defaults.heroTitle,
        heroDescription: defaults.heroDescription,
      });
    },
  );
}

export async function updateDemoCompany(companyId: string, input: CompanyMutationInput) {
  await assertSuperAdminPanelAccess();

  const normalized = normalizeCompanyInput(input);

  return withDevelopmentFallback(
    async () => {
      const current = await db.company.findUnique({
        where: { id: companyId },
        include: {
          settings: true,
        },
      });

      if (!current) {
        throw new DemoCompanyStoreError("Firma bulunamadi.");
      }

      const companies = await getDbCompaniesForUniqueness();
      assertUniqueDomain(companies, normalized.primaryDomain, companyId);

      const defaults = buildCompanyDefaults(normalized.publicName);

      await db.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: {
            legalName: normalized.legalName,
            publicName: normalized.publicName,
            shortName: normalized.shortName,
            panelName: normalized.panelName,
            status: normalized.status as CompanyStatus,
            primaryEmail: normalized.primaryEmail,
            primaryPhone: normalized.primaryPhone,
            whatsappNumber: normalized.whatsappNumber,
            primaryDomain: normalized.primaryDomain,
            taxNumber: normalized.taxNumber,
          },
        });

        await tx.companySetting.upsert({
          where: { companyId },
          update: {
            siteName: normalized.publicName,
            primaryPhone: normalized.primaryPhone,
            primaryEmail: normalized.primaryEmail,
            address: normalized.address,
            whatsappNumber: normalized.whatsappNumber,
            accentLabel: current.settings?.accentLabel ?? defaults.accentLabel,
            heroTitle: current.settings?.heroTitle ?? defaults.heroTitle,
            heroDescription: current.settings?.heroDescription ?? defaults.heroDescription,
          },
          create: {
            companyId,
            siteName: normalized.publicName,
            primaryPhone: normalized.primaryPhone,
            primaryEmail: normalized.primaryEmail,
            address: normalized.address,
            whatsappNumber: normalized.whatsappNumber,
            accentLabel: defaults.accentLabel,
            heroTitle: defaults.heroTitle,
            heroDescription: defaults.heroDescription,
          },
        });

        const primaryWebsite = await tx.companyWebsite.findFirst({
          where: { companyId, isPrimary: true },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (primaryWebsite) {
          await tx.companyWebsite.update({
            where: { id: primaryWebsite.id },
            data: {
              domain: normalized.primaryDomain,
            },
          });
        } else {
          await tx.companyWebsite.create({
            data: {
              companyId,
              name: `${normalized.publicName} Ana Site`,
              slug: "ana-site",
              domain: normalized.primaryDomain,
              locale: "tr-TR",
              isPrimary: true,
              status: "STAGING",
              primaryChannel: "Direkt Talep",
              brandHeadline: defaults.heroTitle,
              metaTitle: `${normalized.publicName} | Villa Kiralama`,
              metaDescription: defaults.heroDescription,
              themeKey: "marketplace-core",
            },
          });
        }
      });

      return await getCompanyRecordById(companyId);
    },
    async () => {
      const companies = await getFallbackCompanyRecords();
      const current = companies.find((company) => company.id === companyId);

      if (!current) {
        throw new DemoCompanyStoreError("Firma bulunamadi.");
      }

      assertUniqueDomain(
        companies.map((company) => ({
          id: company.id,
          primaryDomain: company.primaryDomain || null,
        })),
        normalized.primaryDomain,
        companyId,
      );

      return updateFallbackCompany(companyId, {
        ...normalized,
        primaryEmail: normalized.primaryEmail ?? "",
        primaryDomain: normalized.primaryDomain ?? "",
        supportHours: current.supportHours === "-" ? "" : current.supportHours,
        accentLabel: current.accentLabel,
        heroTitle: current.heroTitle,
        heroDescription: current.heroDescription,
      });
    },
  );
}
