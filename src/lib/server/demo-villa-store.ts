import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  VILLA_IMAGE_RULES,
  type AvailabilityRange,
  chooseCoverGradient,
  formatCurrency,
  normalizeVillaSlug,
  type CatalogVilla,
} from "@/lib/villa-catalog";
import { getResolvedVillaPricing } from "@/lib/demo-operations";
import { getUserSession } from "@/lib/auth/server-session";
import {
  assertPanelCompanyAccess,
  resolvePanelCompanyId,
} from "@/lib/server/demo-company-context";
import {
  dateKey,
  decimalToNumber,
  getDefaultCompanyId,
  getPrimaryWebsiteIdForCompany,
} from "@/lib/server/prisma-demo-shared";
import {
  getFallbackVillas,
} from "@/lib/server/development-fallback-data";
import {
  withDevelopmentFallback,
} from "@/lib/server/development-fallback";
import {
  getDemoDiscountCampaigns,
  getDemoPricingRecords,
  getDemoRequests,
} from "@/lib/server/demo-operations-store";

const demoUploadDirectory = path.join(process.cwd(), "public", "uploads", "villas");

export class DemoVillaStoreError extends Error {}

function sortAvailabilityRanges(ranges: AvailabilityRange[]) {
  return [...ranges].sort(
    (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
  );
}

function sanitizeFileName(value: string) {
  return normalizeVillaSlug(value.replace(/\.webp$/i, "")) || "villa-gorsel";
}

function getTextField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseIntegerField(value: string, fieldLabel: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DemoVillaStoreError(`${fieldLabel} alani gecerli bir sayi olmalidir.`);
  }

  return parsed;
}

function parsePriceField(value: string, fieldLabel: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DemoVillaStoreError(`${fieldLabel} alani gecerli bir fiyat olmalidir.`);
  }

  return parsed;
}

function validateRequiredText(value: string, fieldLabel: string) {
  if (!value) {
    throw new DemoVillaStoreError(`${fieldLabel} alani zorunludur.`);
  }

  return value;
}

function validateImageFiles(files: File[]) {
  if (files.length === 0) {
    throw new DemoVillaStoreError("En az 1 adet WEBP gorsel secmelisin.");
  }

  if (files.length > VILLA_IMAGE_RULES.maxFiles) {
    throw new DemoVillaStoreError(
      `Villa basina en fazla ${VILLA_IMAGE_RULES.maxFiles} adet gorsel yuklenebilir.`,
    );
  }

  for (const file of files) {
    const lowerCaseName = file.name.toLowerCase();
    const isWebp =
      VILLA_IMAGE_RULES.acceptedMimeTypes.includes(file.type as "image/webp") ||
      VILLA_IMAGE_RULES.acceptedExtensions.some((extension) => lowerCaseName.endsWith(extension));

    if (!isWebp) {
      throw new DemoVillaStoreError(`${file.name} dosyasi WEBP formatinda olmali.`);
    }

    if (file.size > VILLA_IMAGE_RULES.maxFileSizeInMb * 1024 * 1024) {
      throw new DemoVillaStoreError(
        `${file.name} dosyasi ${VILLA_IMAGE_RULES.maxFileSizeInMb} MB sinirini asiyor.`,
      );
    }
  }
}

function getFileSystemErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String(error.code);
  }

  return "";
}

async function writeVillaImages(slug: string, files: File[]) {
  const villaUploadDirectory = path.join(demoUploadDirectory, slug);
  const imageUrls: string[] = [];

  try {
    await mkdir(villaUploadDirectory, { recursive: true });

    for (const [index, file] of files.entries()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileBaseName = sanitizeFileName(file.name) || `villa-gorsel-${index + 1}`;
      const fileName = `${String(index + 1).padStart(2, "0")}-${fileBaseName}.webp`;
      const targetPath = path.join(villaUploadDirectory, fileName);
      await writeFile(targetPath, buffer);
      imageUrls.push(`/uploads/villas/${slug}/${fileName}`);
    }
  } catch (error) {
    const code = getFileSystemErrorCode(error);

    console.error("Villa image upload failed", {
      code,
      uploadDirectory: villaUploadDirectory,
      message: error instanceof Error ? error.message : String(error),
    });

    if (code === "EACCES" || code === "EPERM" || code === "EROFS") {
      throw new DemoVillaStoreError(
        "Gorseller sunucudaki upload klasorune yazilamadi. public/uploads/villas icin yazma izni veya kalici storage ayari gerekiyor.",
      );
    }

    throw new DemoVillaStoreError("Gorseller sunucuda kaydedilirken hata olustu.");
  }

  return imageUrls;
}

async function resolveExistingSessionUserId() {
  const session = await getUserSession().catch(() => null);

  if (!session?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true },
  });

  return user?.id ?? null;
}

function mapPrismaVillaCreateError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
    }

    if (error.code === "P2003") {
      throw new DemoVillaStoreError(
        "Villa kaydi bagli firma, web sitesi veya kullanici kaydiyla eslestirilemedi. Canli veritabaninda seed/migration ve oturum bilgileri kontrol edilmeli.",
      );
    }
  }

  throw error;
}

function mapAvailabilityRange(
  range: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    note: string | null;
    blockType: "RESERVED" | "MAINTENANCE" | "UNAVAILABLE" | "OWNER_STAY";
    sourceRequestId: string | null;
  },
): AvailabilityRange {
  return {
    id: range.id,
    startDate: dateKey(range.startsAt),
    endDate: dateKey(range.endsAt),
    label: range.note ?? "Manuel blok",
    status: range.blockType === "OWNER_STAY" ? "UNAVAILABLE" : range.blockType,
    sourceRequestId: range.sourceRequestId ?? undefined,
  };
}

async function queryVillas(input?: { companyId?: string | null; includeAll?: boolean }) {
  const companyId = await resolvePanelCompanyId(input);

  return db.villa.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
      availabilityBlocks: {
        orderBy: { startsAt: "asc" },
      },
      dailyMetrics: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDemoVillas(input?: { companyId?: string | null; includeAll?: boolean }) {
  return withDevelopmentFallback(
    async () => {
      const [villas, pricingRecords, discountCampaigns, requests] = await Promise.all([
        queryVillas(input),
        getDemoPricingRecords(input),
        getDemoDiscountCampaigns(input),
        getDemoRequests(input),
      ]);

      return villas.map((villa, index) => {
        const baseVilla: CatalogVilla = {
          id: villa.id,
          companyId: villa.companyId,
          title: villa.title,
          titleEn: villa.titleEn ?? undefined,
          slug: villa.slug,
          locationLabel: villa.district ? `${villa.district}, ${villa.city}` : villa.city,
          city: villa.city,
          district: villa.district ?? villa.city,
          badge: villa.badge ?? "Secili Villa",
          badgeEn: villa.badgeEn ?? undefined,
          category: villa.category ?? "Villa",
          categoryEn: villa.categoryEn ?? undefined,
          status: villa.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
          featured: villa.featured,
          rating: decimalToNumber(villa.averageRating) || undefined,
          reviewCount: villa.reviewCount || undefined,
          isSuperhost: villa.isSuperhost,
          shortDescription: villa.shortDescription ?? villa.description,
          shortDescriptionEn: villa.shortDescriptionEn ?? undefined,
          description: villa.description,
          descriptionEn: villa.descriptionEn ?? undefined,
          nightlyPrice: decimalToNumber(villa.nightlyBasePrice),
          capacity: villa.capacity,
          bedroomCount: villa.bedroomCount,
          bathroomCount: villa.bathroomCount,
          poolType: villa.poolType ?? "Ozel havuz",
          poolTypeEn: villa.poolTypeEn ?? undefined,
          imageCount: villa.images.length,
          imageUrls: villa.images.map((image) => image.url),
          coverImageUrl:
            villa.images.find((image) => image.isCover)?.url ??
            villa.coverImageUrl ??
            villa.images[0]?.url,
          coverGradient: chooseCoverGradient(index),
          seoTitle: villa.seoTitle ?? villa.title,
          seoTitleEn: villa.seoTitleEn ?? undefined,
          seoDescription: villa.seoDescription ?? villa.shortDescription ?? villa.description,
          seoDescriptionEn: villa.seoDescriptionEn ?? undefined,
          focusKeyword: villa.focusKeyword ?? villa.slug,
          focusKeywordEn: villa.focusKeywordEn ?? undefined,
          coverAlt: villa.coverAlt ?? villa.title,
          coverAltEn: villa.coverAltEn ?? undefined,
          viewCount: villa.dailyMetrics.reduce((sum, metric) => sum + metric.viewCount, 0),
          requestCount: requests.filter((request) => request.villaSlug === villa.slug).length,
          revenueLabel: formatCurrency(
            requests
              .filter((request) => request.villaSlug === villa.slug && request.status === "APPROVED")
              .reduce((sum, request) => sum + request.pricing.grandTotal, 0),
          ),
          createdAt: villa.createdAt.toISOString(),
          availabilityRanges: sortAvailabilityRanges(
            villa.availabilityBlocks.map((range) =>
              mapAvailabilityRange({
                id: range.id,
                startsAt: range.startsAt,
                endsAt: range.endsAt,
                note: range.note,
                blockType: range.blockType,
                sourceRequestId: range.sourceRequestId,
              }),
            ),
          ),
        };

        const resolvedPricing = getResolvedVillaPricing(baseVilla, pricingRecords, discountCampaigns);

        return {
          ...baseVilla,
          nightlyPrice: resolvedPricing.baseNightlyPrice,
          discountedNightlyPrice: resolvedPricing.discountedNightlyPrice,
          cleaningFee: resolvedPricing.cleaningFee,
          minNightCount: resolvedPricing.minNightCount,
          activeDiscountTitle: resolvedPricing.activeDiscount?.title,
          activeDiscountPercent: resolvedPricing.activeDiscount?.percentOff,
        } satisfies CatalogVilla;
      });
    },
    async () => {
      const [villas, pricingRecords, discountCampaigns, requests] = await Promise.all([
        getFallbackVillas(await resolvePanelCompanyId(input)),
        getDemoPricingRecords(input),
        getDemoDiscountCampaigns(input),
        getDemoRequests(input),
      ]);

      return villas.map((villa) => {
        const resolvedPricing = getResolvedVillaPricing(villa, pricingRecords, discountCampaigns);

        return {
          ...villa,
          requestCount: requests.filter((request) => request.villaSlug === villa.slug).length,
          revenueLabel: formatCurrency(
            requests
              .filter((request) => request.villaSlug === villa.slug && request.status === "APPROVED")
              .reduce((sum, request) => sum + request.pricing.grandTotal, 0),
          ),
          nightlyPrice: resolvedPricing.baseNightlyPrice,
          discountedNightlyPrice: resolvedPricing.discountedNightlyPrice,
          cleaningFee: resolvedPricing.cleaningFee,
          minNightCount: resolvedPricing.minNightCount,
          activeDiscountTitle: resolvedPricing.activeDiscount?.title,
          activeDiscountPercent: resolvedPricing.activeDiscount?.percentOff,
        } satisfies CatalogVilla;
      });
    },
  );
}

export async function getDemoVillaBySlug(
  slug: string,
  input?: { companyId?: string | null; includeAll?: boolean },
) {
  const villas = await getDemoVillas(input);
  return villas.find((villa) => villa.slug === slug) ?? null;
}

export async function createDemoVillaFromFormData(
  formData: FormData,
  input?: { companyId?: string | null },
) {
  const session = await getUserSession().catch(() => null);

  if (!session) {
    throw new DemoVillaStoreError("Villa eklemek icin panel oturumu gereklidir.");
  }

  const resolvedCompanyId = (await resolvePanelCompanyId(input)) ?? (await getDefaultCompanyId());

  if (!resolvedCompanyId) {
    throw new DemoVillaStoreError("Villa icin firma scope belirlenemedi.");
  }

  await assertPanelCompanyAccess(resolvedCompanyId);

  const title = validateRequiredText(getTextField(formData, "title"), "Villa basligi");
  const titleEn = validateRequiredText(getTextField(formData, "titleEn"), "Villa basligi (EN)");
  const slugInput = getTextField(formData, "slug") || title;
  const slug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(getTextField(formData, "city"), "Sehir");
  const district = validateRequiredText(getTextField(formData, "district"), "Ilce");
  const badge = validateRequiredText(getTextField(formData, "badge"), "Vitrin etiketi");
  const badgeEn = validateRequiredText(getTextField(formData, "badgeEn"), "Vitrin etiketi (EN)");
  const category = validateRequiredText(getTextField(formData, "category"), "Kategori");
  const categoryEn = validateRequiredText(getTextField(formData, "categoryEn"), "Kategori (EN)");
  const shortDescription = validateRequiredText(
    getTextField(formData, "shortDescription"),
    "Kisa aciklama",
  );
  const shortDescriptionEn = validateRequiredText(
    getTextField(formData, "shortDescriptionEn"),
    "Kisa aciklama (EN)",
  );
  const description = validateRequiredText(
    getTextField(formData, "description"),
    "Detayli aciklama",
  );
  const descriptionEn = validateRequiredText(
    getTextField(formData, "descriptionEn"),
    "Detayli aciklama (EN)",
  );
  const seoTitle = validateRequiredText(getTextField(formData, "seoTitle"), "SEO basligi");
  const seoTitleEn = validateRequiredText(getTextField(formData, "seoTitleEn"), "SEO basligi (EN)");
  const seoDescription = validateRequiredText(
    getTextField(formData, "seoDescription"),
    "Meta aciklama",
  );
  const seoDescriptionEn = validateRequiredText(
    getTextField(formData, "seoDescriptionEn"),
    "Meta aciklama (EN)",
  );
  const focusKeyword = validateRequiredText(
    getTextField(formData, "focusKeyword"),
    "Odak anahtar kelime",
  );
  const focusKeywordEn = validateRequiredText(
    getTextField(formData, "focusKeywordEn"),
    "Odak anahtar kelime (EN)",
  );
  const coverAlt = validateRequiredText(
    getTextField(formData, "coverAlt"),
    "Kapak gorseli alt metni",
  );
  const coverAltEn = validateRequiredText(
    getTextField(formData, "coverAltEn"),
    "Kapak gorseli alt metni (EN)",
  );

  if (!slug) {
    throw new DemoVillaStoreError("SEO uyumlu bir slug olusturulamadi.");
  }

  const capacity = parseIntegerField(getTextField(formData, "capacity"), "Kapasite");
  const bedroomCount = parseIntegerField(getTextField(formData, "bedroomCount"), "Oda sayisi");
  const bathroomCount = parseIntegerField(getTextField(formData, "bathroomCount"), "Banyo sayisi");
  const nightlyPrice = parsePriceField(getTextField(formData, "nightlyPrice"), "Gecelik fiyat");
  const discountedNightlyPriceValue = getTextField(formData, "discountedNightlyPrice");
  const discountedNightlyPrice = discountedNightlyPriceValue
    ? parsePriceField(discountedNightlyPriceValue, "Indirimli fiyat")
    : undefined;

  if (discountedNightlyPrice && discountedNightlyPrice >= nightlyPrice) {
    throw new DemoVillaStoreError("Indirimli fiyat normal fiyattan kucuk olmalidir.");
  }

  const poolType = validateRequiredText(getTextField(formData, "poolType"), "Havuz tipi");
  const poolTypeEn = validateRequiredText(getTextField(formData, "poolTypeEn"), "Havuz tipi (EN)");
  const featured = getTextField(formData, "featured") === "on";
  const status = getTextField(formData, "status") === "DRAFT" ? "DRAFT" : "ACTIVE";
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  validateImageFiles(files);

  const existing = await db.villa.findFirst({
    where: {
      companyId: resolvedCompanyId,
      slug,
    },
    select: { id: true },
  });

  if (existing) {
    throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
  }

  const imageUrls = await writeVillaImages(slug, files);
  const createdByUserId = await resolveExistingSessionUserId();
  const websiteId = await getPrimaryWebsiteIdForCompany(resolvedCompanyId);
  const region = await db.region.findFirst({
    where: {
      companyId: resolvedCompanyId,
      OR: [{ name: { equals: district, mode: "insensitive" } }, { name: { equals: city, mode: "insensitive" } }],
    },
    select: { id: true },
  });

  const villa = await db.villa
    .create({
      data: {
        companyId: resolvedCompanyId,
        websiteId,
        regionId: region?.id,
        createdByUserId,
        title,
        titleEn,
        slug,
        badge,
        badgeEn,
        category,
        categoryEn,
        shortDescription,
        shortDescriptionEn,
        description,
        descriptionEn,
        city,
        district,
        address: `${district}, ${city}`,
        capacity,
        bedroomCount,
        bathroomCount,
        poolType,
        poolTypeEn,
        nightlyBasePrice: nightlyPrice,
        cleaningFee: 0,
        minNightCount: 1,
        currency: "TRY",
        status,
        featured,
        averageRating: 0,
        reviewCount: 0,
        isSuperhost: false,
        coverImageUrl: imageUrls[0],
        coverAlt,
        coverAltEn,
        seoTitle,
        seoTitleEn,
        seoDescription,
        seoDescriptionEn,
        focusKeyword,
        focusKeywordEn,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            storageKey: url.replace("/uploads/villas/", ""),
            altText: index === 0 ? coverAlt : `${title} galeri gorseli ${index + 1}`,
            sortOrder: index + 1,
            isCover: index === 0,
          })),
        },
      },
    })
    .catch(mapPrismaVillaCreateError);

  return {
    id: villa.id,
    companyId: villa.companyId,
    title: villa.title,
    titleEn: villa.titleEn ?? titleEn,
    slug: villa.slug,
    locationLabel: `${district}, ${city}`,
    city: villa.city,
    district: villa.district ?? city,
    badge: villa.badge ?? badge,
    badgeEn: villa.badgeEn ?? badgeEn,
    category: villa.category ?? category,
    categoryEn: villa.categoryEn ?? categoryEn,
    status: villa.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    featured: villa.featured,
    shortDescription: villa.shortDescription ?? shortDescription,
    shortDescriptionEn: villa.shortDescriptionEn ?? shortDescriptionEn,
    description: villa.description,
    descriptionEn: villa.descriptionEn ?? descriptionEn,
    nightlyPrice: decimalToNumber(villa.nightlyBasePrice),
    discountedNightlyPrice,
    capacity: villa.capacity,
    bedroomCount: villa.bedroomCount,
    bathroomCount: villa.bathroomCount,
    poolType: villa.poolType ?? poolType,
    poolTypeEn: villa.poolTypeEn ?? poolTypeEn,
    imageCount: imageUrls.length,
    imageUrls,
    coverImageUrl: imageUrls[0],
    coverGradient: chooseCoverGradient(0),
    seoTitle: villa.seoTitle ?? seoTitle,
    seoTitleEn: villa.seoTitleEn ?? seoTitleEn,
    seoDescription: villa.seoDescription ?? seoDescription,
    seoDescriptionEn: villa.seoDescriptionEn ?? seoDescriptionEn,
    focusKeyword: villa.focusKeyword ?? focusKeyword,
    focusKeywordEn: villa.focusKeywordEn ?? focusKeywordEn,
    coverAlt: villa.coverAlt ?? coverAlt,
    coverAltEn: villa.coverAltEn ?? coverAltEn,
    viewCount: 0,
    requestCount: 0,
    revenueLabel: formatCurrency(0),
    createdAt: villa.createdAt.toISOString(),
    availabilityRanges: [],
  } satisfies CatalogVilla;
}

export async function addDemoVillaAvailability(input: {
  slug: string;
  startDate: string;
  endDate: string;
  label: string;
  status: AvailabilityRange["status"];
  sourceRequestId?: string;
}) {
  const villa = await db.villa.findFirst({
    where: { slug: input.slug },
    include: {
      availabilityBlocks: true,
    },
  });

  if (!villa) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  await assertPanelCompanyAccess(villa.companyId);

  if (!input.startDate || !input.endDate) {
    throw new DemoVillaStoreError("Baslangic ve bitis tarihi zorunludur.");
  }

  const startDate = new Date(`${input.startDate}T00:00:00`);
  const endDate = new Date(`${input.endDate}T23:59:59.999Z`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new DemoVillaStoreError("Tarih alani gecerli degil.");
  }

  if (endDate <= startDate) {
    throw new DemoVillaStoreError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
  }

  const overlaps = villa.availabilityBlocks.find(
    (range) => startDate < range.endsAt && endDate > range.startsAt,
  );

  if (overlaps) {
    throw new DemoVillaStoreError(
      `${dateKey(overlaps.startsAt)} - ${dateKey(overlaps.endsAt)} araliginda baska bir blok zaten kayitli.`,
    );
  }

  await db.villaAvailabilityBlock.create({
    data: {
      id: `availability-${randomUUID().slice(0, 8)}`,
      villaId: villa.id,
      createdByUserId: (await getUserSession().catch(() => null))?.id,
      startsAt: startDate,
      endsAt: endDate,
      blockType: input.status,
      note: input.label.trim() || "Manuel blok",
      sourceRequestId: input.sourceRequestId,
    },
  });

  const updatedVilla = await getDemoVillaBySlug(input.slug, { companyId: villa.companyId });

  if (!updatedVilla) {
    throw new DemoVillaStoreError("Villa uygunluk kaydi eklendikten sonra okunamadi.");
  }

  return updatedVilla;
}

export async function deleteDemoVillaAvailability(input: { slug: string; rangeId: string }) {
  const range = await db.villaAvailabilityBlock.findFirst({
    where: {
      id: input.rangeId,
      villa: {
        slug: input.slug,
      },
    },
    include: {
      villa: {
        select: { companyId: true },
      },
    },
  });

  if (!range) {
    throw new DemoVillaStoreError("Silinecek uygunluk kaydi bulunamadi.");
  }

  await assertPanelCompanyAccess(range.villa.companyId);
  await db.villaAvailabilityBlock.delete({
    where: { id: range.id },
  });

  const updatedVilla = await getDemoVillaBySlug(input.slug, { companyId: range.villa.companyId });

  if (!updatedVilla) {
    throw new DemoVillaStoreError("Villa uygunluk kaydi silindikten sonra okunamadi.");
  }

  return updatedVilla;
}

export async function deleteDemoVillaAvailabilityByRequestId(input: {
  slug: string;
  requestId: string;
}) {
  const villa = await db.villa.findFirst({
    where: { slug: input.slug },
    select: { id: true, companyId: true },
  });

  if (!villa) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  await assertPanelCompanyAccess(villa.companyId);

  await db.villaAvailabilityBlock.deleteMany({
    where: {
      villaId: villa.id,
      sourceRequestId: input.requestId,
      blockType: "RESERVED",
    },
  });

  const updatedVilla = await getDemoVillaBySlug(input.slug, { companyId: villa.companyId });

  if (!updatedVilla) {
    throw new DemoVillaStoreError("Villa uygunluk kaydi guncellenemedi.");
  }

  return updatedVilla;
}
