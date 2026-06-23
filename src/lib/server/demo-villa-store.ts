import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import sharp from "sharp";
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
  deleteFallbackVilla,
  getFallbackVillas,
  saveFallbackVilla,
  updateFallbackVillaStatus,
} from "@/lib/server/development-fallback-data";
import {
  isDevelopmentFallbackForced,
  isPrismaConnectionError,
  withDevelopmentFallback,
} from "@/lib/server/development-fallback";
import {
  getDemoDiscountCampaigns,
  getDemoPricingRecords,
  getDemoRequests,
} from "@/lib/server/demo-operations-store";

const demoUploadDirectory = path.join(process.cwd(), "public", "uploads", "villas");

export class DemoVillaStoreError extends Error {}

export class DemoVillaUnexpectedError extends Error {
  readonly stage: string;
  override cause: unknown;

  constructor(stage: string, cause: unknown) {
    super(getUnknownErrorMessage(cause));
    this.name = "DemoVillaUnexpectedError";
    this.stage = stage;
    this.cause = cause;
  }
}

function getUnknownErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function runVillaCreateStep<T>(stage: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DemoVillaStoreError || error instanceof DemoVillaUnexpectedError) {
      throw error;
    }

    throw new DemoVillaUnexpectedError(stage, error);
  }
}

function sortAvailabilityRanges(ranges: AvailabilityRange[]) {
  return [...ranges].sort(
    (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
  );
}

function sanitizeFileName(value: string) {
  return normalizeVillaSlug(path.parse(value).name) || "villa-gorsel";
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

function parseVillaStatus(value: string, fallback: CatalogVilla["status"] = "ACTIVE") {
  if (value === "ACTIVE" || value === "DRAFT" || value === "PAUSED" || value === "ARCHIVED") {
    return value;
  }

  return fallback;
}

function validateImageFiles(files: File[], options: { requireAtLeastOne?: boolean } = {}) {
  const requireAtLeastOne = options.requireAtLeastOne ?? true;

  if (requireAtLeastOne && files.length === 0) {
    throw new DemoVillaStoreError("En az 1 adet gorsel secmelisin.");
  }

  for (const file of files) {
    const lowerCaseName = file.name.toLowerCase();
    const hasImageMime = file.type.startsWith("image/");
    const hasAcceptedMime = VILLA_IMAGE_RULES.acceptedMimeTypes.some(
      (mimeType) => mimeType === file.type,
    );
    const hasAcceptedExtension = VILLA_IMAGE_RULES.acceptedExtensions.some((extension) =>
      lowerCaseName.endsWith(extension),
    );

    if (!hasImageMime && !hasAcceptedMime && !hasAcceptedExtension) {
      throw new DemoVillaStoreError(
        `${file.name} dosyasi desteklenen bir resim formati olmali. Desteklenen formatlar: ${VILLA_IMAGE_RULES.acceptedInputLabel}.`,
      );
    }
  }
}

async function convertImageToWebpBuffer(file: File) {
  const sourceBuffer = Buffer.from(await file.arrayBuffer());

  try {
    return await sharp(sourceBuffer, {
      failOn: "error",
      limitInputPixels: 100_000_000,
    })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();
  } catch (error) {
    console.error("Villa image conversion failed", {
      fileName: file.name,
      fileType: file.type,
      message: error instanceof Error ? error.message : String(error),
    });

    throw new DemoVillaStoreError(
      `${file.name} dosyasi WEBP formatina cevrilemedi. Lutfen JPG, PNG, WEBP veya desteklenen bir resim dosyasi yukle.`,
    );
  }
}

function getFileSystemErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String(error.code);
  }

  return "";
}

async function writeVillaImages(slug: string, files: File[], startIndex = 0) {
  const villaUploadDirectory = path.join(demoUploadDirectory, slug);
  const imageUrls: string[] = [];

  try {
    await mkdir(villaUploadDirectory, { recursive: true });

    for (const [index, file] of files.entries()) {
      const buffer = await convertImageToWebpBuffer(file);
      const imageIndex = startIndex + index + 1;
      const fileBaseName = sanitizeFileName(file.name) || `villa-gorsel-${imageIndex}`;
      const fileName = `${String(imageIndex).padStart(2, "0")}-${fileBaseName}.webp`;
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

type DemoVillaQueryInput = {
  companyId?: string | null;
  includeAll?: boolean;
  includeMetrics?: boolean;
  includeInactive?: boolean;
};

async function queryVillas(input?: DemoVillaQueryInput) {
  const companyId = await resolvePanelCompanyId(input);
  const where: Prisma.VillaWhereInput = {
    ...(companyId ? { companyId } : {}),
    ...(input?.includeInactive === false ? { status: "ACTIVE" } : {}),
  };

  return db.villa.findMany({
    where,
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

function filterVisibleVillas(villas: CatalogVilla[], input?: DemoVillaQueryInput) {
  if (input?.includeInactive === false) {
    return villas.filter((villa) => villa.status === "ACTIVE");
  }

  return villas;
}

export async function getDemoVillas(input?: DemoVillaQueryInput) {
  const includeMetrics = input?.includeMetrics ?? true;

  return withDevelopmentFallback(
    async () => {
      const [villas, pricingRecords, discountCampaigns, requests] = await Promise.all([
        queryVillas(input),
        getDemoPricingRecords(input),
        getDemoDiscountCampaigns(input),
        includeMetrics ? getDemoRequests(input) : Promise.resolve([]),
      ]);

      return villas.map((villa, index) => {
        const villaRequests = includeMetrics
          ? requests.filter((request) => request.villaSlug === villa.slug)
          : [];
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
          status: villa.status,
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
          requestCount: includeMetrics ? villaRequests.length : 0,
          revenueLabel: includeMetrics
            ? formatCurrency(
                villaRequests
                  .filter((request) => request.status === "APPROVED")
                  .reduce((sum, request) => sum + request.pricing.grandTotal, 0),
              )
            : formatCurrency(0),
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
        includeMetrics ? getDemoRequests(input) : Promise.resolve([]),
      ]);

      return filterVisibleVillas(villas, input).map((villa) => {
        const resolvedPricing = getResolvedVillaPricing(villa, pricingRecords, discountCampaigns);
        const villaRequests = includeMetrics
          ? requests.filter((request) => request.villaSlug === villa.slug)
          : [];

        return {
          ...villa,
          requestCount: includeMetrics ? villaRequests.length : 0,
          revenueLabel: includeMetrics
            ? formatCurrency(
                villaRequests
                  .filter((request) => request.status === "APPROVED")
                  .reduce((sum, request) => sum + request.pricing.grandTotal, 0),
              )
            : formatCurrency(0),
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
  input?: DemoVillaQueryInput,
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

  const resolvedCompanyId = await runVillaCreateStep(
    "VILLA_COMPANY_SCOPE",
    async () => (await resolvePanelCompanyId(input)) ?? (await getDefaultCompanyId()),
  );

  if (!resolvedCompanyId) {
    throw new DemoVillaStoreError("Villa icin firma scope belirlenemedi.");
  }

  const companyId = resolvedCompanyId;

  await runVillaCreateStep("VILLA_COMPANY_ACCESS", async () => assertPanelCompanyAccess(companyId));

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
  const status = parseVillaStatus(getTextField(formData, "status"));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  validateImageFiles(files);

  async function createFallbackVilla() {
    const fallbackVillas = await runVillaCreateStep("VILLA_FALLBACK_LIST", async () =>
      getFallbackVillas(companyId),
    );
    const existingFallback = fallbackVillas.find((villa) => villa.slug === slug);

    if (existingFallback) {
      throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
    }

    const imageUrls = await runVillaCreateStep("VILLA_IMAGE_WRITE", async () =>
      writeVillaImages(slug, files),
    );
    const fallbackVilla = await runVillaCreateStep("VILLA_FALLBACK_SAVE", async () =>
      saveFallbackVilla({
        id: `villa-${randomUUID().slice(0, 8)}`,
        companyId,
        title,
        titleEn,
        slug,
        locationLabel: `${district}, ${city}`,
        city,
        district,
        badge,
        badgeEn,
        category,
        categoryEn,
        status,
        featured,
        isSuperhost: false,
        shortDescription,
        shortDescriptionEn,
        description,
        descriptionEn,
        nightlyPrice,
        discountedNightlyPrice,
        cleaningFee: 0,
        minNightCount: 1,
        capacity,
        bedroomCount,
        bathroomCount,
        poolType,
        poolTypeEn,
        imageCount: imageUrls.length,
        imageUrls,
        coverImageUrl: imageUrls[0],
        coverGradient: chooseCoverGradient(fallbackVillas.length),
        seoTitle,
        seoTitleEn,
        seoDescription,
        seoDescriptionEn,
        focusKeyword,
        focusKeywordEn,
        coverAlt,
        coverAltEn,
        viewCount: 0,
        requestCount: 0,
        revenueLabel: formatCurrency(0),
        createdAt: new Date().toISOString(),
        availabilityRanges: [],
      } satisfies CatalogVilla),
    );

    return fallbackVilla;
  }

  if (isDevelopmentFallbackForced()) {
    return await createFallbackVilla();
  }

  let existing: { id: string } | null;

  try {
    existing = await db.villa.findFirst({
      where: {
        companyId,
        slug,
      },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return await createFallbackVilla();
    }

    throw new DemoVillaUnexpectedError("VILLA_DUPLICATE_CHECK", error);
  }

  if (existing) {
    throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
  }

  const imageUrls = await runVillaCreateStep("VILLA_IMAGE_WRITE", async () =>
    writeVillaImages(slug, files),
  );
  const createdByUserId = await runVillaCreateStep("VILLA_SESSION_USER_LOOKUP", async () =>
    resolveExistingSessionUserId(),
  );
  const websiteId = await runVillaCreateStep("VILLA_WEBSITE_LOOKUP", async () =>
    getPrimaryWebsiteIdForCompany(companyId),
  );
  const region = await runVillaCreateStep("VILLA_REGION_LOOKUP", async () =>
    db.region.findFirst({
      where: {
        companyId,
        OR: [
          { name: { equals: district, mode: "insensitive" } },
          { name: { equals: city, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    }),
  );

  const villa = await runVillaCreateStep("VILLA_DB_CREATE", async () =>
    db.villa
      .create({
        data: {
          companyId,
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
      .catch(mapPrismaVillaCreateError),
  );

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
    status: villa.status,
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

async function getFallbackVillaForMutation(slug: string, input?: { companyId?: string | null }) {
  const companyId = await resolvePanelCompanyId(input);
  const villas = await getFallbackVillas(companyId);
  const villa = villas.find((item) => item.slug === slug) ?? null;

  if (!villa) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  await assertPanelCompanyAccess(villa.companyId);

  return villa;
}

async function resolveDbVillaForMutation(slug: string, input?: { companyId?: string | null }) {
  const companyId = await resolvePanelCompanyId(input);
  const villa = await db.villa.findFirst({
    where: {
      slug,
      ...(companyId ? { companyId } : {}),
    },
    select: {
      id: true,
      companyId: true,
      slug: true,
    },
  });

  if (!villa) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  await assertPanelCompanyAccess(villa.companyId);

  return villa;
}

export async function updateDemoVillaFromFormData(
  slug: string,
  formData: FormData,
  input?: { companyId?: string | null },
) {
  const title = validateRequiredText(getTextField(formData, "title"), "Villa basligi");
  const titleEn = validateRequiredText(getTextField(formData, "titleEn"), "Villa basligi (EN)");
  const slugInput = getTextField(formData, "slug") || title;
  const nextSlug = normalizeVillaSlug(slugInput);
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

  if (!nextSlug) {
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
  const status = parseVillaStatus(getTextField(formData, "status"));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  validateImageFiles(files, { requireAtLeastOne: false });

  async function updateFallbackVillaRecord() {
    const current = await getFallbackVillaForMutation(slug, input);
    const fallbackVillas = await getFallbackVillas(current.companyId);
    const duplicate = fallbackVillas.find(
      (villa) => villa.slug === nextSlug && villa.slug !== current.slug,
    );

    if (duplicate) {
      throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
    }

    const newImageUrls =
      files.length > 0
        ? await writeVillaImages(nextSlug, files, current.imageUrls.length)
        : [];
    const imageUrls = [...current.imageUrls, ...newImageUrls];
    const updatedVilla = {
      ...current,
      title,
      titleEn,
      slug: nextSlug,
      locationLabel: `${district}, ${city}`,
      city,
      district,
      badge,
      badgeEn,
      category,
      categoryEn,
      status,
      featured,
      shortDescription,
      shortDescriptionEn,
      description,
      descriptionEn,
      nightlyPrice,
      discountedNightlyPrice,
      capacity,
      bedroomCount,
      bathroomCount,
      poolType,
      poolTypeEn,
      imageCount: imageUrls.length,
      imageUrls,
      coverImageUrl: current.coverImageUrl ?? imageUrls[0],
      seoTitle,
      seoTitleEn,
      seoDescription,
      seoDescriptionEn,
      focusKeyword,
      focusKeywordEn,
      coverAlt,
      coverAltEn,
    } satisfies CatalogVilla;

    if (nextSlug !== current.slug) {
      await deleteFallbackVilla(current.companyId, current.slug);
    }

    return await saveFallbackVilla(updatedVilla);
  }

  if (isDevelopmentFallbackForced()) {
    return await updateFallbackVillaRecord();
  }

  try {
    const scopedCompanyId = await resolvePanelCompanyId(input);
    const current = await db.villa.findFirst({
      where: {
        slug,
        ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
      },
      include: {
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!current) {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    await assertPanelCompanyAccess(current.companyId);

    if (nextSlug !== current.slug) {
      const duplicate = await db.villa.findFirst({
        where: {
          companyId: current.companyId,
          slug: nextSlug,
          NOT: { id: current.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
      }
    }

    const newImageUrls =
      files.length > 0 ? await writeVillaImages(nextSlug, files, current.images.length) : [];
    const coverImageUrl = current.coverImageUrl ?? current.images[0]?.url ?? newImageUrls[0];

    await db.villa.update({
      where: { id: current.id },
      data: {
        title,
        titleEn,
        slug: nextSlug,
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
        status,
        featured,
        coverImageUrl,
        coverAlt,
        coverAltEn,
        seoTitle,
        seoTitleEn,
        seoDescription,
        seoDescriptionEn,
        focusKeyword,
        focusKeywordEn,
        ...(newImageUrls.length > 0
          ? {
              images: {
                create: newImageUrls.map((url, index) => ({
                  url,
                  storageKey: url.replace("/uploads/villas/", ""),
                  altText:
                    current.images.length + index === 0
                      ? coverAlt
                      : `${title} galeri gorseli ${current.images.length + index + 1}`,
                  sortOrder: current.images.length + index + 1,
                  isCover: current.images.length === 0 && index === 0,
                })),
              },
            }
          : {}),
      },
    });

    const updatedVilla = await getDemoVillaBySlug(nextSlug, {
      companyId: current.companyId,
      includeMetrics: false,
    });

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Villa guncellendi ancak tekrar okunamadi.");
    }

    return updatedVilla;
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return await updateFallbackVillaRecord();
    }

    throw error;
  }
}

export async function updateDemoVillaStatus(
  slug: string,
  status: Extract<CatalogVilla["status"], "ACTIVE" | "DRAFT" | "PAUSED" | "ARCHIVED">,
  input?: { companyId?: string | null },
) {
  async function updateFallbackStatus() {
    const villa = await getFallbackVillaForMutation(slug, input);
    const updatedVilla = await updateFallbackVillaStatus(villa.companyId, slug, status);

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    return updatedVilla;
  }

  if (isDevelopmentFallbackForced()) {
    return await updateFallbackStatus();
  }

  try {
    const villa = await resolveDbVillaForMutation(slug, input);
    const updated = await db.villa.update({
      where: { id: villa.id },
      data: { status },
      include: {
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
        availabilityBlocks: {
          orderBy: { startsAt: "asc" },
        },
        dailyMetrics: true,
      },
    });

    return {
      id: updated.id,
      companyId: updated.companyId,
      title: updated.title,
      titleEn: updated.titleEn ?? undefined,
      slug: updated.slug,
      locationLabel: updated.district ? `${updated.district}, ${updated.city}` : updated.city,
      city: updated.city,
      district: updated.district ?? updated.city,
      badge: updated.badge ?? "Secili Villa",
      badgeEn: updated.badgeEn ?? undefined,
      category: updated.category ?? "Villa",
      categoryEn: updated.categoryEn ?? undefined,
      status: updated.status,
      featured: updated.featured,
      rating: decimalToNumber(updated.averageRating) || undefined,
      reviewCount: updated.reviewCount || undefined,
      isSuperhost: updated.isSuperhost,
      shortDescription: updated.shortDescription ?? updated.description,
      shortDescriptionEn: updated.shortDescriptionEn ?? undefined,
      description: updated.description,
      descriptionEn: updated.descriptionEn ?? undefined,
      nightlyPrice: decimalToNumber(updated.nightlyBasePrice),
      cleaningFee: decimalToNumber(updated.cleaningFee),
      minNightCount: updated.minNightCount,
      capacity: updated.capacity,
      bedroomCount: updated.bedroomCount,
      bathroomCount: updated.bathroomCount,
      poolType: updated.poolType ?? "Ozel havuz",
      poolTypeEn: updated.poolTypeEn ?? undefined,
      imageCount: updated.images.length,
      imageUrls: updated.images.map((image) => image.url),
      coverImageUrl:
        updated.images.find((image) => image.isCover)?.url ??
        updated.coverImageUrl ??
        updated.images[0]?.url,
      coverGradient: chooseCoverGradient(0),
      seoTitle: updated.seoTitle ?? updated.title,
      seoTitleEn: updated.seoTitleEn ?? undefined,
      seoDescription: updated.seoDescription ?? updated.shortDescription ?? updated.description,
      seoDescriptionEn: updated.seoDescriptionEn ?? undefined,
      focusKeyword: updated.focusKeyword ?? updated.slug,
      focusKeywordEn: updated.focusKeywordEn ?? undefined,
      coverAlt: updated.coverAlt ?? updated.title,
      coverAltEn: updated.coverAltEn ?? undefined,
      viewCount: updated.dailyMetrics.reduce((sum, metric) => sum + metric.viewCount, 0),
      requestCount: 0,
      revenueLabel: formatCurrency(0),
      createdAt: updated.createdAt.toISOString(),
      availabilityRanges: sortAvailabilityRanges(
        updated.availabilityBlocks.map((range) =>
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
    } satisfies CatalogVilla;
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return await updateFallbackStatus();
    }

    throw error;
  }
}

async function removeVillaUploadDirectory(slug: string) {
  const villaUploadDirectory = path.join(demoUploadDirectory, slug);

  try {
    await rm(villaUploadDirectory, { recursive: true, force: true });
  } catch (error) {
    console.error("Villa upload directory cleanup failed", {
      slug,
      uploadDirectory: villaUploadDirectory,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function deleteDemoVilla(slug: string, input?: { companyId?: string | null }) {
  async function deleteFallbackRecord() {
    const villa = await getFallbackVillaForMutation(slug, input);
    const deleted = await deleteFallbackVilla(villa.companyId, slug);

    if (!deleted) {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    await removeVillaUploadDirectory(slug);

    return { slug };
  }

  if (isDevelopmentFallbackForced()) {
    return await deleteFallbackRecord();
  }

  try {
    const villa = await resolveDbVillaForMutation(slug, input);

    await db.villa.delete({
      where: { id: villa.id },
    });

    await removeVillaUploadDirectory(slug);

    return { slug };
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return await deleteFallbackRecord();
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    throw error;
  }
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
