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
  ensureFallbackRegionForVillaLocation,
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
const villaWatermarkText = "BookToVilla";
const villaWatermarkXmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:btv="https://booktovilla.com/ns/1.0/" btv:WatermarkVersion="1" btv:WatermarkText="BookToVilla" />
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

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

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeWatermarkText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function createVillaWatermarkOverlay(imageWidth: number, imageHeight: number, value: string) {
  const margin = Math.max(12, Math.round(Math.min(imageWidth, imageHeight) * 0.025));
  const fontSize = Math.min(
    52,
    Math.max(18, Math.round(Math.min(imageWidth, imageHeight) * 0.04)),
  );
  const horizontalPadding = Math.round(fontSize * 0.75);
  const verticalPadding = Math.round(fontSize * 0.45);
  const maxTextCharacters = Math.max(
    8,
    Math.floor((imageWidth * 0.42 - horizontalPadding * 2) / (fontSize * 0.62)),
  );
  const normalizedText = normalizeWatermarkText(value);
  const displayText =
    normalizedText.length > maxTextCharacters
      ? `${normalizedText.slice(0, Math.max(1, maxTextCharacters - 1)).trimEnd()}...`
      : normalizedText;
  const estimatedTextWidth = Math.ceil(displayText.length * fontSize * 0.62);
  const overlayWidth = Math.min(
    imageWidth - margin * 2,
    Math.max(fontSize * 4, estimatedTextWidth + horizontalPadding * 2),
  );
  const overlayHeight = fontSize + verticalPadding * 2;
  const textWidth = Math.max(fontSize * 2, overlayWidth - horizontalPadding * 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${overlayWidth}" height="${overlayHeight}" viewBox="0 0 ${overlayWidth} ${overlayHeight}">
      <rect width="${overlayWidth}" height="${overlayHeight}" rx="6" fill="#111827" fill-opacity="0.48" />
      <text
        x="${overlayWidth / 2}"
        y="${overlayHeight / 2}"
        dy="0.36em"
        text-anchor="middle"
        textLength="${textWidth}"
        lengthAdjust="spacingAndGlyphs"
        fill="#ffffff"
        fill-opacity="0.92"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="0.4"
      >${escapeSvgText(displayText)}</text>
    </svg>
  `;

  return {
    input: Buffer.from(svg),
    left: Math.round((imageWidth - overlayWidth) / 2),
    top: Math.round((imageHeight - overlayHeight) / 2),
  };
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

function normalizeLocationField(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeShortCode(value: string) {
  return value.replace(/\s+/g, "").trim().toUpperCase();
}

function sameLocationText(left: string | null | undefined, right: string | null | undefined) {
  return normalizeLocationField(left ?? "").toLocaleLowerCase("tr-TR") ===
    normalizeLocationField(right ?? "").toLocaleLowerCase("tr-TR");
}

function appendUniqueDistrictScope(scope: string[], district: string) {
  const normalizedDistrict = normalizeLocationField(district);

  if (!normalizedDistrict) {
    return scope;
  }

  if (scope.some((item) => sameLocationText(item, normalizedDistrict))) {
    return scope;
  }

  return [...scope, normalizedDistrict];
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

function getPdfFile(formData: FormData) {
  const file = formData.get("tourismLicensePdf");

  if (file instanceof File && file.size > 0) {
    return file;
  }

  return null;
}

function validatePdfFile(file: File | null) {
  if (!file) {
    return;
  }

  const lowerCaseName = file.name.toLowerCase();

  if (file.type !== "application/pdf" && !lowerCaseName.endsWith(".pdf")) {
    throw new DemoVillaStoreError("Turizm isletme belgesi PDF formatinda olmalidir.");
  }
}

async function convertImageToWebpBuffer(file: File, watermarkText: string) {
  const sourceBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const { data, info } = await sharp(sourceBuffer, {
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
      .toColourspace("srgb")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels,
      },
    })
      .composite([createVillaWatermarkOverlay(info.width, info.height, watermarkText)])
      .webp({
        quality: 82,
        effort: 4,
      })
      .withXmp(villaWatermarkXmp)
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

async function writeVillaImages(
  slug: string,
  files: File[],
  options: { watermarkText: string; startIndex?: number },
) {
  const villaUploadDirectory = path.join(demoUploadDirectory, slug);
  const imageUrls: string[] = [];
  const startIndex = options.startIndex ?? 0;

  try {
    await mkdir(villaUploadDirectory, { recursive: true });

    for (const [index, file] of files.entries()) {
      const buffer = await convertImageToWebpBuffer(file, options.watermarkText);
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

async function ensureVillaRegion(companyId: string, city: string, district: string) {
  const region = await db.region.findFirst({
    where: {
      companyId,
      OR: [
        { city: { equals: city, mode: "insensitive" } },
        { name: { equals: city, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      districtScope: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (region) {
    const nextDistrictScope = appendUniqueDistrictScope(region.districtScope, district);
    const shouldUpdate =
      nextDistrictScope.length !== region.districtScope.length ||
      !sameLocationText(region.name, city) ||
      !sameLocationText(region.city, city);

    if (shouldUpdate) {
      await db.region.update({
        where: { id: region.id },
        data: {
          name: sameLocationText(region.name, city) ? region.name : city,
          city: sameLocationText(region.city, city) ? region.city : city,
          districtScope: nextDistrictScope,
        },
      });
    }

    return region.id;
  }

  try {
    const created = await db.region.create({
      data: {
        companyId,
        name: city,
        city,
        districtScope: district ? [district] : [],
      },
      select: { id: true },
    });

    return created.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.region.findFirst({
        where: {
          companyId,
          name: city,
          city,
        },
        select: { id: true },
      });

      if (existing) {
        return existing.id;
      }
    }

    throw error;
  }
}

async function writeVillaPdfDocument(slug: string, file: File | null) {
  if (!file) {
    return undefined;
  }

  const documentUploadDirectory = path.join(demoUploadDirectory, slug, "documents");
  const fileBaseName = sanitizeFileName(file.name) || "turizm-isletme-belgesi";
  const fileName = `${fileBaseName}.pdf`;
  const targetPath = path.join(documentUploadDirectory, fileName);

  try {
    await mkdir(documentUploadDirectory, { recursive: true });
    await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

    return `/uploads/villas/${slug}/documents/${fileName}`;
  } catch (error) {
    const code = getFileSystemErrorCode(error);

    console.error("Villa PDF upload failed", {
      code,
      uploadDirectory: documentUploadDirectory,
      message: error instanceof Error ? error.message : String(error),
    });

    if (code === "EACCES" || code === "EPERM" || code === "EROFS") {
      throw new DemoVillaStoreError(
        "PDF dosyasi sunucudaki upload klasorune yazilamadi. public/uploads/villas icin yazma izni veya kalici storage ayari gerekiyor.",
      );
    }

    throw new DemoVillaStoreError("PDF dosyasi sunucuda kaydedilirken hata olustu.");
  }
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
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

      if (target.includes("shortCode")) {
        throw new DemoVillaStoreError("Bu kisa kod zaten kullaniliyor. Lutfen farkli bir kod gir.");
      }

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
          shortCode: villa.shortCode ?? undefined,
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
          tourismLicenseNumber: villa.tourismLicenseNumber ?? undefined,
          tourismLicensePdfUrl: villa.tourismLicensePdfUrl ?? undefined,
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
  const watermarkText = villaWatermarkText;

  const title = validateRequiredText(getTextField(formData, "title"), "Villa basligi");
  const titleEn = validateRequiredText(getTextField(formData, "titleEn"), "Villa basligi (EN)");
  const shortCode = validateRequiredText(normalizeShortCode(getTextField(formData, "shortCode")), "Kisa kod");
  const slugInput = getTextField(formData, "slug") || title;
  const slug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(normalizeLocationField(getTextField(formData, "city")), "Lokasyon");
  const district = validateRequiredText(normalizeLocationField(getTextField(formData, "district")), "Bolge");
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
  const tourismLicenseNumber = getTextField(formData, "tourismLicenseNumber") || undefined;
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
  const tourismLicensePdf = getPdfFile(formData);

  validateImageFiles(files);
  validatePdfFile(tourismLicensePdf);

  async function createFallbackVilla() {
    const fallbackVillas = await runVillaCreateStep("VILLA_FALLBACK_LIST", async () =>
      getFallbackVillas(companyId),
    );
    const existingFallback = fallbackVillas.find((villa) => villa.slug === slug);

    if (existingFallback) {
      throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
    }

    const existingFallbackCode = fallbackVillas.find((villa) => villa.shortCode === shortCode);

    if (existingFallbackCode) {
      throw new DemoVillaStoreError("Bu kisa kod zaten kullaniliyor. Lutfen farkli bir kod gir.");
    }

    const imageUrls = await runVillaCreateStep("VILLA_IMAGE_WRITE", async () =>
      writeVillaImages(slug, files, { watermarkText }),
    );
    const tourismLicensePdfUrl = await runVillaCreateStep("VILLA_PDF_WRITE", async () =>
      writeVillaPdfDocument(slug, tourismLicensePdf),
    );
    await runVillaCreateStep("VILLA_FALLBACK_REGION_SYNC", async () =>
      ensureFallbackRegionForVillaLocation(companyId, city, district),
    );
    const fallbackVilla = await runVillaCreateStep("VILLA_FALLBACK_SAVE", async () =>
      saveFallbackVilla({
        id: `villa-${randomUUID().slice(0, 8)}`,
        companyId,
        title,
        titleEn,
        shortCode,
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
        tourismLicenseNumber,
        tourismLicensePdfUrl,
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

  let existing: { id: string; slug: string; shortCode: string | null } | null;

  try {
    existing = await db.villa.findFirst({
      where: {
        companyId,
        OR: [{ slug }, { shortCode }],
      },
      select: { id: true, slug: true, shortCode: true },
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return await createFallbackVilla();
    }

    throw new DemoVillaUnexpectedError("VILLA_DUPLICATE_CHECK", error);
  }

  if (existing) {
    if (existing.shortCode === shortCode) {
      throw new DemoVillaStoreError("Bu kisa kod zaten kullaniliyor. Lutfen farkli bir kod gir.");
    }

    throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
  }

  const imageUrls = await runVillaCreateStep("VILLA_IMAGE_WRITE", async () =>
    writeVillaImages(slug, files, { watermarkText }),
  );
  const tourismLicensePdfUrl = await runVillaCreateStep("VILLA_PDF_WRITE", async () =>
    writeVillaPdfDocument(slug, tourismLicensePdf),
  );
  const createdByUserId = await runVillaCreateStep("VILLA_SESSION_USER_LOOKUP", async () =>
    resolveExistingSessionUserId(),
  );
  const websiteId = await runVillaCreateStep("VILLA_WEBSITE_LOOKUP", async () =>
    getPrimaryWebsiteIdForCompany(companyId),
  );
  const regionId = await runVillaCreateStep("VILLA_REGION_SYNC", async () =>
    ensureVillaRegion(companyId, city, district),
  );

  const villa = await runVillaCreateStep("VILLA_DB_CREATE", async () =>
    db.villa
      .create({
        data: {
          companyId,
          websiteId,
          regionId,
          createdByUserId,
          title,
          titleEn,
          shortCode,
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
          tourismLicenseNumber,
          tourismLicensePdfUrl,
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
    shortCode: villa.shortCode ?? shortCode,
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
    tourismLicenseNumber: villa.tourismLicenseNumber ?? tourismLicenseNumber,
    tourismLicensePdfUrl: villa.tourismLicensePdfUrl ?? tourismLicensePdfUrl,
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
  const shortCode = validateRequiredText(normalizeShortCode(getTextField(formData, "shortCode")), "Kisa kod");
  const slugInput = getTextField(formData, "slug") || title;
  const nextSlug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(normalizeLocationField(getTextField(formData, "city")), "Lokasyon");
  const district = validateRequiredText(normalizeLocationField(getTextField(formData, "district")), "Bolge");
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
  const tourismLicenseNumber = getTextField(formData, "tourismLicenseNumber") || undefined;
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
  const tourismLicensePdf = getPdfFile(formData);

  validateImageFiles(files, { requireAtLeastOne: false });
  validatePdfFile(tourismLicensePdf);

  async function updateFallbackVillaRecord() {
    const current = await getFallbackVillaForMutation(slug, input);
    const fallbackVillas = await getFallbackVillas(current.companyId);
    const duplicate = fallbackVillas.find(
      (villa) =>
        villa.slug !== current.slug &&
        (villa.slug === nextSlug || villa.shortCode === shortCode),
    );

    if (duplicate) {
      if (duplicate.shortCode === shortCode) {
        throw new DemoVillaStoreError("Bu kisa kod zaten kullaniliyor. Lutfen farkli bir kod gir.");
      }

      throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
    }

    const newImageUrls =
      files.length > 0
        ? await writeVillaImages(nextSlug, files, {
            watermarkText: villaWatermarkText,
            startIndex: current.imageUrls.length,
          })
        : [];
    const newTourismLicensePdfUrl = await writeVillaPdfDocument(nextSlug, tourismLicensePdf);
    const imageUrls = [...current.imageUrls, ...newImageUrls];
    await ensureFallbackRegionForVillaLocation(current.companyId, city, district);
    const updatedVilla = {
      ...current,
      title,
      titleEn,
      shortCode,
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
      tourismLicenseNumber,
      tourismLicensePdfUrl: newTourismLicensePdfUrl ?? current.tourismLicensePdfUrl,
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
    const watermarkText = villaWatermarkText;

    if (nextSlug !== current.slug || shortCode !== current.shortCode) {
      const duplicate = await db.villa.findFirst({
        where: {
          companyId: current.companyId,
          OR: [{ slug: nextSlug }, { shortCode }],
          NOT: { id: current.id },
        },
        select: { id: true, slug: true, shortCode: true },
      });

      if (duplicate) {
        if (duplicate.shortCode === shortCode) {
          throw new DemoVillaStoreError("Bu kisa kod zaten kullaniliyor. Lutfen farkli bir kod gir.");
        }

        throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
      }
    }

    const newImageUrls =
      files.length > 0
        ? await writeVillaImages(nextSlug, files, {
            watermarkText,
            startIndex: current.images.length,
          })
        : [];
    const newTourismLicensePdfUrl = await writeVillaPdfDocument(nextSlug, tourismLicensePdf);
    const coverImageUrl = current.coverImageUrl ?? current.images[0]?.url ?? newImageUrls[0];
    const regionId = await ensureVillaRegion(current.companyId, city, district);

    await db.villa.update({
      where: { id: current.id },
      data: {
        title,
        titleEn,
        shortCode,
        slug: nextSlug,
        badge,
        badgeEn,
        category,
        categoryEn,
        shortDescription,
        shortDescriptionEn,
        description,
        descriptionEn,
        regionId,
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
        tourismLicenseNumber,
        ...(newTourismLicensePdfUrl ? { tourismLicensePdfUrl: newTourismLicensePdfUrl } : {}),
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
