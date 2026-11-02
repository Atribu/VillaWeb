import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { VILLA_AMENITY_OPTIONS, type CatalogVilla } from "@/lib/villa-catalog";
import { toPublicVilla } from "@/lib/public-villa";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { requiredText } from "@/lib/panel-workspace";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { getCompanyRecordBySlug } from "@/lib/server/company-store";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { getFallbackVillas, getFallbackCompanyRecords } from "@/lib/server/development-fallback-data";
import { mutatePlatformLocal, readPlatformLocal } from "@/lib/server/platform-local";
import { readPlatformConfig } from "@/lib/server/company-platform";

export type PortfolioShare = { id: string; sourceCompanyId: string; recipientCompanyId: string; villaId: string;
  state: string; nightlyPrice: number; commissionPercent: number; version: number; acceptedAt: string | null; createdAt: string; updatedAt: string };
function serialize(row: { nightlyPrice: unknown; commissionPercent: unknown; acceptedAt: Date | null; createdAt: Date; updatedAt: Date } & Omit<PortfolioShare, "nightlyPrice" | "commissionPercent" | "acceptedAt" | "createdAt" | "updatedAt">): PortfolioShare {
  return { ...row, nightlyPrice: Number(row.nightlyPrice), commissionPercent: Number(row.commissionPercent), acceptedAt: row.acceptedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
export async function listPortfolioShares(companyId: string) {
  await requirePanelPermission("sharing"); await assertPanelCompanyAccess(companyId);
  return withDevelopmentFallback(async () => (await db.villaShare.findMany({ where: { OR: [{ sourceCompanyId: companyId }, { recipientCompanyId: companyId }] }, orderBy: { updatedAt: "desc" },
    include: { villa: { select: { title: true } }, sourceCompany: { select: { publicName: true } }, recipientCompany: { select: { publicName: true } } } })).map(({ villa, sourceCompany, recipientCompany, ...row }) => ({ ...serialize(row), title: villa.title, sourceName: sourceCompany.publicName, recipientName: recipientCompany.publicName })), async () => {
    const companies = await getFallbackCompanyRecords(); const villas = await getFallbackVillas();
    return (await readPlatformLocal<PortfolioShare>("portfolio-shares")).filter(row => row.sourceCompanyId === companyId || row.recipientCompanyId === companyId).map(row => ({ ...row,
      title: villas.find(villa => villa.id === row.villaId)?.title ?? "Villa", sourceName: companies.find(company => company.id === row.sourceCompanyId)?.name ?? "Firma", recipientName: companies.find(company => company.id === row.recipientCompanyId)?.name ?? "Firma" }));
  });
}
export async function offerPortfolio(input: Record<string, unknown>) {
  await requirePanelPermission("sharing"); const companyId = requiredText(input.companyId, "Firma"); await assertPanelCompanyAccess(companyId);
  const recipient = await getCompanyRecordBySlug(requiredText(input.recipientSlug, "Alıcı firma kodu"));
  if (!recipient || recipient.status !== "ACTIVE" || recipient.id === companyId) throw new PanelRecordError("Aktif ve farklı bir alıcı firma seçin.");
  if (!(await readPlatformConfig(companyId)).package.modules.includes("sharing") || !(await readPlatformConfig(recipient.id)).package.modules.includes("sharing")) throw new PanelRecordError("Her iki firmanın paketinde portföy paylaşımı açık olmalı.");
  const villaId = requiredText(input.villaId, "Villa"); const nightlyPrice = Number(input.nightlyPrice), commissionPercent = Number(input.commissionPercent);
  if (!Number.isFinite(nightlyPrice) || nightlyPrice <= 0 || nightlyPrice > 999999999 || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) throw new PanelRecordError("Geçerli fiyat ve %0-100 komisyon girin.");
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villaId} FOR UPDATE`;
    const villa = await tx.villa.findFirst({ where: { id: villaId, companyId, status: "ACTIVE" } }); if (!villa) throw new PanelRecordError("Firmanıza ait aktif villa bulunamadı.", 404);
    const old = await tx.villaShare.findUnique({ where: { villaId_recipientCompanyId: { villaId, recipientCompanyId: recipient.id } } });
    if (old && old.state !== "REVOKED") throw new PanelRecordError("Mevcut paylaşımı önce geri çekin. Fiyat değişikliği yeniden onay gerektirir.", 409);
    const data = { nightlyPrice, commissionPercent, state: "PENDING", acceptedAt: null };
    return serialize(await tx.villaShare.upsert({ where: { villaId_recipientCompanyId: { villaId, recipientCompanyId: recipient.id } },
      create: { ...data, villaId, sourceCompanyId: companyId, recipientCompanyId: recipient.id }, update: { ...data, version: { increment: 1 } } }));
  }), () => mutatePlatformLocal<PortfolioShare, PortfolioShare>("portfolio-shares", async rows => {
    const villa = (await getFallbackVillas(companyId)).find(row => row.id === villaId && row.status === "ACTIVE"); if (!villa) throw new PanelRecordError("Firmanıza ait aktif villa bulunamadı.", 404);
    const old = rows.find(row => row.villaId === villaId && row.recipientCompanyId === recipient.id);
    if (old && old.state !== "REVOKED") throw new PanelRecordError("Mevcut paylaşımı önce geri çekin.", 409);
    const now = new Date().toISOString(); const row: PortfolioShare = { id: old?.id ?? randomUUID(), sourceCompanyId: companyId, recipientCompanyId: recipient.id, villaId, state: "PENDING",
      nightlyPrice, commissionPercent, version: (old?.version ?? 0) + 1, acceptedAt: null, createdAt: old?.createdAt ?? now, updatedAt: now };
    if (old) rows[rows.indexOf(old)] = row; else rows.push(row); return row;
  }));
}
export async function respondPortfolio(companyId: string, id: string, version: number, action: string) {
  await requirePanelPermission("sharing"); await assertPanelCompanyAccess(companyId);
  function change(row: PortfolioShare) {
    if (row.version !== version) throw new PanelRecordError("Paylaşım koşulları değişmiş. Yenileyin.", 409);
    if (![row.sourceCompanyId, row.recipientCompanyId].includes(companyId)) throw new PanelRecordError("Paylaşım bulunamadı.", 404);
    if (action === "accept") {
      if (row.recipientCompanyId !== companyId || row.state !== "PENDING") throw new PanelRecordError("Yalnızca alıcı firma bekleyen teklifi kabul edebilir.", 403);
      row.state = "ACTIVE"; row.acceptedAt = new Date().toISOString();
    } else if (action === "revoke") { row.state = "REVOKED"; }
    else throw new PanelRecordError("Geçersiz işlem.");
    row.version++; row.updatedAt = new Date().toISOString(); return row;
  }
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    const initial = await tx.villaShare.findFirst({ where: { id, OR: [{ sourceCompanyId: companyId }, { recipientCompanyId: companyId }] } }); if (!initial) throw new PanelRecordError("Paylaşım bulunamadı.", 404);
    await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${initial.villaId} FOR UPDATE`;
    const current = await tx.villaShare.findUniqueOrThrow({ where: { id } }); const next = change(serialize(current));
    await tx.villaShare.update({ where: { id }, data: { state: next.state, acceptedAt: next.acceptedAt ? new Date(next.acceptedAt) : null, version: next.version } }); return next;
  }), () => mutatePlatformLocal<PortfolioShare, PortfolioShare>("portfolio-shares", rows => { const row = rows.find(item => item.id === id); if (!row) throw new PanelRecordError("Paylaşım bulunamadı.", 404); return change(row); }));
}
export function sharedVilla(villa: CatalogVilla, share: PortfolioShare): CatalogVilla {
  return { ...toPublicVilla(villa), companyId: share.recipientCompanyId, slug: `ortak-${share.id}`, portfolioShareId: share.id, portfolioShareVersion: share.version,
    nightlyPrice: share.nightlyPrice, discountedNightlyPrice: undefined, activeDiscountTitle: undefined, activeDiscountPercent: undefined,
    pricingPeriods: villa.pricingPeriods?.map(period => ({ ...period, nightlyPrice: share.nightlyPrice, weekendPercent: 0, earlyBookingDays: 0, earlyBookingPercent: 0 })) };
}
// Explicit grant-only catalogue. Never fetch another tenant's requests, metrics or supplier records.
export async function getPublicSharedVillas(companyId: string): Promise<CatalogVilla[]> {
  if (!(await readPlatformConfig(companyId)).package.modules.includes("sharing")) return [];
  return withDevelopmentFallback(async () => {
    const shares = await db.villaShare.findMany({ where: { recipientCompanyId: companyId, state: "ACTIVE", sourceCompany: { status: "ACTIVE" }, recipientCompany: { status: "ACTIVE" }, villa: { status: "ACTIVE" } },
      include: { villa: { select: {
        id: true, companyId: true, slug: true, title: true, titleEn: true, district: true, city: true,
        badge: true, badgeEn: true, category: true, categoryEn: true, shortDescription: true, shortDescriptionEn: true,
        description: true, descriptionEn: true, nightlyBasePrice: true, cleaningFee: true, minNightCount: true,
        capacity: true, bedroomCount: true, bathroomCount: true, poolType: true, poolTypeEn: true,
        checkInTime: true, checkOutTime: true, houseRules: true, houseRulesEn: true, suitabilityTags: true,
        coverImageUrl: true, coverAlt: true, seoTitle: true, seoTitleEn: true, seoDescription: true, seoDescriptionEn: true,
        focusKeyword: true, tourismLicenseNumber: true, tourismLicensePdfUrl: true, createdAt: true,
        shortCode: true, address: true, latitude: true, longitude: true, marketDistanceMeters: true,
        beachDistanceMeters: true, centerDistanceMeters: true, airportDistanceKm: true,
        electricityFee: true, waterFee: true, extraGuestFee: true, damageDeposit: true, extraFeeNotes: true, extraFeeNotesEn: true,
        coverAltEn: true, focusKeywordEn: true,
        amenities: { select: { amenity: { select: { key: true, label: true, category: true } } } },
        images: { select: { url: true, isCover: true }, orderBy: { sortOrder: "asc" } },
        availabilityBlocks: { select: { id: true, startsAt: true, endsAt: true } },
        pricingRules: { select: { id: true, title: true, startsAt: true, endsAt: true, nightlyPrice: true, cleaningFee: true, minNightCount: true, isActive: true, ruleType: true } },
      } } } });
    const result: CatalogVilla[] = [];
    for (const { villa, ...row } of shares) {
      if (!(await readPlatformConfig(row.sourceCompanyId)).package.modules.includes("sharing")) continue;
      const publicVilla: CatalogVilla = {
        id: villa.id, companyId: villa.companyId, slug: villa.slug, title: villa.title, titleEn: villa.titleEn ?? undefined,
        shortCode: villa.shortCode ?? undefined, address: villa.address ?? undefined,
        latitude: villa.latitude === null ? undefined : Number(villa.latitude), longitude: villa.longitude === null ? undefined : Number(villa.longitude),
        marketDistanceMeters: villa.marketDistanceMeters ?? undefined, beachDistanceMeters: villa.beachDistanceMeters ?? undefined,
        centerDistanceMeters: villa.centerDistanceMeters ?? undefined, airportDistanceKm: villa.airportDistanceKm ?? undefined,
        electricityFee: Number(villa.electricityFee), waterFee: Number(villa.waterFee), extraGuestFee: Number(villa.extraGuestFee), damageDeposit: Number(villa.damageDeposit),
        extraFeeNotes: villa.extraFeeNotes ?? undefined, extraFeeNotesEn: villa.extraFeeNotesEn ?? undefined,
        coverAltEn: villa.coverAltEn ?? undefined, focusKeywordEn: villa.focusKeywordEn ?? undefined,
        locationLabel: [villa.district, villa.city].filter(Boolean).join(", "), city: villa.city, district: villa.district ?? villa.city,
        badge: villa.badge ?? "Seçili villa", badgeEn: villa.badgeEn ?? undefined, category: villa.category ?? "Villa", categoryEn: villa.categoryEn ?? undefined, status: "ACTIVE", featured: false,
        shortDescription: villa.shortDescription ?? villa.description, shortDescriptionEn: villa.shortDescriptionEn ?? undefined, description: villa.description, descriptionEn: villa.descriptionEn ?? undefined,
        nightlyPrice: Number(villa.nightlyBasePrice), cleaningFee: Number(villa.cleaningFee), minNightCount: villa.minNightCount, capacity: villa.capacity, bedroomCount: villa.bedroomCount, bathroomCount: villa.bathroomCount,
        poolType: villa.poolType ?? "Özel havuz", poolTypeEn: villa.poolTypeEn ?? undefined, checkInTime: villa.checkInTime ?? undefined, checkOutTime: villa.checkOutTime ?? undefined,
        houseRules: villa.houseRules, houseRulesEn: villa.houseRulesEn, suitabilityTags: villa.suitabilityTags, imageCount: villa.images.length, imageUrls: villa.images.map(image => image.url),
        coverImageUrl: villa.images.find(image => image.isCover)?.url ?? villa.coverImageUrl ?? villa.images[0]?.url, coverGradient: "from-slate-700 to-slate-400", coverAlt: villa.coverAlt ?? villa.title,
        amenities: villa.amenities.map(({ amenity }) => {
          const option = VILLA_AMENITY_OPTIONS.find(item => item.key === amenity.key);
          return { key: amenity.key, label: amenity.label, labelEn: option?.labelEn ?? amenity.label, category: amenity.category ?? option?.category ?? "Genel", categoryEn: option?.categoryEn ?? amenity.category ?? "General" };
        }),
        seoTitle: villa.seoTitle ?? villa.title, seoTitleEn: villa.seoTitleEn ?? undefined, seoDescription: villa.seoDescription ?? villa.description, seoDescriptionEn: villa.seoDescriptionEn ?? undefined,
        focusKeyword: villa.focusKeyword ?? villa.title, tourismLicenseNumber: villa.tourismLicenseNumber ?? undefined, tourismLicensePdfUrl: villa.tourismLicensePdfUrl ?? undefined,
        viewCount: 0, requestCount: 0, revenueLabel: "", createdAt: villa.createdAt.toISOString(),
        availabilityRanges: villa.availabilityBlocks.map(block => ({ id: block.id, startDate: block.startsAt.toISOString().slice(0, 10), endDate: block.endsAt.toISOString().slice(0, 10), status: "UNAVAILABLE", label: "Dolu" })),
        pricingPeriods: villa.pricingRules.filter(rule => rule.ruleType === "SEASONAL").map(rule => ({ id: rule.id, title: rule.title, startDate: rule.startsAt.toISOString().slice(0, 10), endDate: rule.endsAt.toISOString().slice(0, 10), nightlyPrice: Number(rule.nightlyPrice), cleaningFee: rule.cleaningFee === null ? undefined : Number(rule.cleaningFee), minNightCount: rule.minNightCount ?? undefined, active: rule.isActive })),
      };
      result.push(sharedVilla(publicVilla, serialize(row)));
    }
    return result;
  }, async () => {
    const companies = await getFallbackCompanyRecords(); const active = new Set(companies.filter(company => company.status === "ACTIVE").map(company => company.id));
    const shares = (await readPlatformLocal<PortfolioShare>("portfolio-shares")).filter(row => row.recipientCompanyId === companyId && row.state === "ACTIVE" && active.has(row.sourceCompanyId) && active.has(companyId));
    const result: CatalogVilla[] = [];
    for (const share of shares) {
      if (!(await readPlatformConfig(share.sourceCompanyId)).package.modules.includes("sharing")) continue;
      const villa = (await getFallbackVillas(share.sourceCompanyId)).find(item => item.id === share.villaId && item.status === "ACTIVE");
      if (villa) result.push(sharedVilla(villa, share));
    }
    return result;
  });
}
export async function readBookingShare(id: string, companyId: string, villaId: string, tx?: Prisma.TransactionClient) {
  const share = await withDevelopmentFallback(async () => {
    const row = await (tx ?? db).villaShare.findFirst({ where: { id, sourceCompany: { status: "ACTIVE" }, recipientCompany: { status: "ACTIVE" }, villa: { status: "ACTIVE" } } }); return row ? serialize(row) : null;
  }, async () => {
    const row = (await readPlatformLocal<PortfolioShare>("portfolio-shares")).find(row => row.id === id);
    if (!row) return null;
    const active = new Set((await getFallbackCompanyRecords()).filter(company => company.status === "ACTIVE").map(company => company.id));
    if (!active.has(row.sourceCompanyId) || !active.has(row.recipientCompanyId)) return null;
    return (await getFallbackVillas(row.sourceCompanyId)).some(villa => villa.id === row.villaId && villa.status === "ACTIVE") ? row : null;
  });
  if (!share || share.state !== "ACTIVE" || share.recipientCompanyId !== companyId || share.villaId !== villaId) throw new PanelRecordError("Portföy paylaşımı artık geçerli değil.", 409);
  for (const id of [companyId, share.sourceCompanyId]) if (!(await readPlatformConfig(id, tx)).package.modules.includes("sharing")) throw new PanelRecordError("Portföy paylaşımı kapatılmış.", 409);
  return share;
}
