import "server-only";
import { writePanelAudit } from "@/lib/server/panel-audit";
import { readStagedImages, StagedVillaImage } from "@/lib/server/staged-villa-images";
import { assertPublicationReady } from "@/lib/server/publication-policy";
import { PanelRecordError } from "@/lib/panel-record-tools";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import sharp from "sharp";
import { db } from "@/lib/db";
import { isDateKey, shiftDateKey } from "@/lib/booking-dates";
import { toPublicVilla } from "@/lib/public-villa";
import { validatePricingPeriod, type PricingPeriodInput } from "@/lib/villa-pricing-periods";
import {
  VILLA_AMENITY_OPTIONS,
  VILLA_HOUSE_RULE_OPTIONS,
  VILLA_IMAGE_RULES,
  VILLA_SUITABILITY_OPTIONS,
  type AvailabilityRange,
  chooseCoverGradient,
  formatCurrency,
  normalizeVillaSlug,
  type CatalogVilla,
  type VillaAmenityItem,
  type VillaPricingPeriod,
} from "@/lib/villa-catalog";
import { getResolvedVillaPricing } from "@/lib/demo-operations";
import { getUserSession } from "@/lib/auth/server-session";
import {
  assertPanelCompanyAccess,
  resolvePanelCompanyId,
  resolveCatalogCompanyId,
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

function sortPricingPeriods(periods: VillaPricingPeriod[]) {
  return [...periods].sort(
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
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DemoVillaStoreError(`${fieldLabel} alani gecerli bir fiyat olmalidir.`);
  }

  return parsed;
}

function parseNonNegativeNumberField(value: string, fieldLabel: string, fallback = 0) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new DemoVillaStoreError(`${fieldLabel} alani sifir veya daha buyuk olmalidir.`);
  }

  return parsed;
}

function parseOptionalNumberField(
  value: string,
  fieldLabel: string,
  options?: { integer?: boolean; min?: number; max?: number },
) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.replace(",", ".");
  const parsed = Number(normalizedValue);
  const min = options?.min ?? 0;

  if (
    !Number.isFinite(parsed) ||
    (options?.integer && !Number.isInteger(parsed)) ||
    parsed < min ||
    (typeof options?.max === "number" && parsed > options.max)
  ) {
    throw new DemoVillaStoreError(`${fieldLabel} alani gecerli bir sayi olmalidir.`);
  }

  return parsed;
}

function parseOptionalTimeField(value: string, fieldLabel: string) {
  if (!value) {
    return undefined;
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new DemoVillaStoreError(`${fieldLabel} HH:MM formatinda olmalidir.`);
  }

  return value;
}

function parseLineList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getSelectedValues(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );
}

function getVillaOperationalInput(formData: FormData) {
  const amenityKeys = getSelectedValues(formData, "amenities");
  const knownAmenities = new Map(VILLA_AMENITY_OPTIONS.map((item) => [item.key, item]));
  const amenities = amenityKeys.map((key) => knownAmenities.get(key)).filter(Boolean) as VillaAmenityItem[];

  if (amenities.length !== amenityKeys.length) {
    throw new DemoVillaStoreError("Secilen villa olanaklarindan biri gecersiz.");
  }

  const suitabilityTags = getSelectedValues(formData, "suitabilityTags");
  const knownSuitabilityTags = new Set<string>(VILLA_SUITABILITY_OPTIONS.map((item) => item.key));

  if (suitabilityTags.some((key) => !knownSuitabilityTags.has(key))) {
    throw new DemoVillaStoreError("Secilen uygunluk etiketlerinden biri gecersiz.");
  }

  const selectedRules = getSelectedValues(formData, "houseRulePresets");
  const presetRules = VILLA_HOUSE_RULE_OPTIONS.filter((rule) => selectedRules.includes(rule.key));
  if (suitabilityTags.includes("pet-friendly") && selectedRules.includes("no-pets")) {
    throw new DemoVillaStoreError("Evcil hayvan kabul edilir ve evcil hayvan yasagi birlikte secilemez.");
  }
  if (Boolean(getTextField(formData, "latitude")) !== Boolean(getTextField(formData, "longitude"))) {
    throw new DemoVillaStoreError("Harita icin enlem ve boylami birlikte girin.");
  }

  return {
    address: getTextField(formData, "address") || undefined,
    ownerVillaName: getTextField(formData, "ownerVillaName") || undefined,
    supplierName: getTextField(formData, "supplierName") || undefined,
    supplierPhone: getTextField(formData, "supplierPhone") || undefined,
    supplierEmail: getTextField(formData, "supplierEmail") || undefined,
    supplierNotes: getTextField(formData, "supplierNotes") || undefined,
    latitude: parseOptionalNumberField(getTextField(formData, "latitude"), "Enlem", {
      min: -90,
      max: 90,
    }),
    longitude: parseOptionalNumberField(getTextField(formData, "longitude"), "Boylam", {
      min: -180,
      max: 180,
    }),
    marketDistanceMeters: parseOptionalNumberField(
      getTextField(formData, "marketDistanceMeters"),
      "Market mesafesi",
      { integer: true },
    ),
    beachDistanceMeters: parseOptionalNumberField(
      getTextField(formData, "beachDistanceMeters"),
      "Deniz mesafesi",
      { integer: true },
    ),
    centerDistanceMeters: parseOptionalNumberField(
      getTextField(formData, "centerDistanceMeters"),
      "Merkez mesafesi",
      { integer: true },
    ),
    airportDistanceKm: parseOptionalNumberField(
      getTextField(formData, "airportDistanceKm"),
      "Havalimani mesafesi",
    ),
    checkInTime: parseOptionalTimeField(getTextField(formData, "checkInTime"), "Giris saati"),
    checkOutTime: parseOptionalTimeField(getTextField(formData, "checkOutTime"), "Cikis saati"),
    suitabilityTags,
    amenities,
    houseRules: [...new Set([...presetRules.map((rule) => rule.label), ...parseLineList(getTextField(formData, "houseRules"))])],
    houseRulesEn: [...new Set([...presetRules.map((rule) => rule.labelEn), ...parseLineList(getTextField(formData, "houseRulesEn"))])],
    cleaningFee: parseNonNegativeNumberField(getTextField(formData, "cleaningFee"), "Temizlik ucreti"),
    electricityFee: parseNonNegativeNumberField(
      getTextField(formData, "electricityFee"),
      "Elektrik ucreti",
    ),
    waterFee: parseNonNegativeNumberField(getTextField(formData, "waterFee"), "Su ucreti"),
    extraGuestFee: parseNonNegativeNumberField(
      getTextField(formData, "extraGuestFee"),
      "Ek misafir ucreti",
    ),
    damageDeposit: parseNonNegativeNumberField(
      getTextField(formData, "damageDeposit"),
      "Hasar depozitosu",
    ),
    extraFeeNotes: getTextField(formData, "extraFeeNotes") || undefined,
    extraFeeNotesEn: getTextField(formData, "extraFeeNotesEn") || undefined,
    minNightCount: parseIntegerField(getTextField(formData, "minNightCount") || "1", "Minimum gece"),
  };
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

export async function convertImageToWebpBuffer(file: File, watermarkText: string) {
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
      const buffer = file instanceof StagedVillaImage ? Buffer.from(await file.arrayBuffer()) : await convertImageToWebpBuffer(file, options.watermarkText);
      const imageIndex = startIndex + index + 1;
      const fileBaseName = sanitizeFileName(file.name) || `villa-gorsel-${imageIndex}`;
      // Gallery removals/reordering must never let a later upload overwrite an old URL.
      const fileName = `${String(imageIndex).padStart(2, "0")}-${fileBaseName}-${randomUUID()}.webp`;
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
    calendarSourceId?: string | null;
    externalEventId?: string | null;
  },
): AvailabilityRange {
  return {
    id: range.id,
    startDate: dateKey(range.startsAt),
    endDate: range.endsAt.getUTCHours() === 23 ? shiftDateKey(dateKey(range.endsAt), 1) : dateKey(range.endsAt),
    label: range.note ?? "Manuel blok",
    status: range.blockType === "OWNER_STAY" ? "UNAVAILABLE" : range.blockType,
    sourceRequestId: range.sourceRequestId ?? undefined,
    calendarSourceId: range.calendarSourceId ?? undefined,
    externalEventId: range.externalEventId ?? undefined,
  };
}

function mapVillaAmenity(item: {
  amenity: { key: string; label: string; category: string | null };
}): VillaAmenityItem {
  const option = VILLA_AMENITY_OPTIONS.find((candidate) => candidate.key === item.amenity.key);

  return {
    key: item.amenity.key,
    label: item.amenity.label,
    labelEn: option?.labelEn ?? item.amenity.label,
    category: item.amenity.category ?? option?.category ?? "Genel",
    categoryEn: option?.categoryEn ?? item.amenity.category ?? "General",
  };
}

function mapVillaPricingPeriod(rule: {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  nightlyPrice: Prisma.Decimal;
  cleaningFee: Prisma.Decimal | null;
  minNightCount: number | null;
  isActive: boolean;
}): VillaPricingPeriod {
  return {
    id: rule.id,
    title: rule.title,
    startDate: dateKey(rule.startsAt),
    endDate: dateKey(rule.endsAt),
    nightlyPrice: decimalToNumber(rule.nightlyPrice),
    cleaningFee: rule.cleaningFee === null ? undefined : decimalToNumber(rule.cleaningFee),
    minNightCount: rule.minNightCount ?? undefined,
    active: rule.isActive,
  };
}

type DemoVillaQueryInput = {
  publicSite?: boolean;
  companyId?: string | null;
  includeAll?: boolean;
  includeMetrics?: boolean;
  includeInactive?: boolean;
};

async function queryVillas(input?: DemoVillaQueryInput) {
  const companyId = await resolveCatalogCompanyId(input);
  const where: Prisma.VillaWhereInput = {
    ...(companyId ? { companyId } : {}),
    ...(input?.includeInactive === false ? { status: "ACTIVE" } : {}),
  };

  return db.villa.findMany({
    where,
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      availabilityBlocks: {
        orderBy: { startsAt: "asc" },
      },
      amenities: {
        include: { amenity: true },
        orderBy: { amenity: { label: "asc" } },
      },
      pricingRules: {
        where: { ruleType: "SEASONAL" },
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

  const results = await withDevelopmentFallback(
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
          address: villa.address ?? undefined,
          ownerVillaName: villa.ownerVillaName ?? undefined,
          supplierName: villa.supplierName ?? undefined,
          supplierPhone: villa.supplierPhone ?? undefined,
          supplierEmail: villa.supplierEmail ?? undefined,
          supplierNotes: villa.supplierNotes ?? undefined,
          latitude: villa.latitude === null ? undefined : decimalToNumber(villa.latitude),
          longitude: villa.longitude === null ? undefined : decimalToNumber(villa.longitude),
          marketDistanceMeters: villa.marketDistanceMeters ?? undefined,
          beachDistanceMeters: villa.beachDistanceMeters ?? undefined,
          centerDistanceMeters: villa.centerDistanceMeters ?? undefined,
          airportDistanceKm: villa.airportDistanceKm ?? undefined,
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
          checkInTime: villa.checkInTime ?? undefined,
          checkOutTime: villa.checkOutTime ?? undefined,
          suitabilityTags: villa.suitabilityTags,
          amenities: villa.amenities.map(mapVillaAmenity),
          houseRules: villa.houseRules,
          houseRulesEn: villa.houseRulesEn,
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
          cleaningFee: decimalToNumber(villa.cleaningFee),
          electricityFee: decimalToNumber(villa.electricityFee),
          waterFee: decimalToNumber(villa.waterFee),
          extraGuestFee: decimalToNumber(villa.extraGuestFee),
          damageDeposit: decimalToNumber(villa.damageDeposit),
          extraFeeNotes: villa.extraFeeNotes ?? undefined,
          extraFeeNotesEn: villa.extraFeeNotesEn ?? undefined,
          minNightCount: villa.minNightCount,
          pricingPeriods: villa.pricingRules.map(mapVillaPricingPeriod),
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
                calendarSourceId: range.calendarSourceId,
                externalEventId: range.externalEventId,
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
        getFallbackVillas(await resolveCatalogCompanyId(input)),
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
  return input?.includeInactive === false ? results.map(toPublicVilla) : results;
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
  const titleEn = getTextField(formData, "titleEn");
  const shortCode = validateRequiredText(normalizeShortCode(getTextField(formData, "shortCode")), "Kisa kod");
  const slugInput = getTextField(formData, "slug") || title;
  const slug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(normalizeLocationField(getTextField(formData, "city")), "Lokasyon");
  const district = validateRequiredText(normalizeLocationField(getTextField(formData, "district")), "Bolge");
  const badge = validateRequiredText(getTextField(formData, "badge"), "Vitrin etiketi");
  const badgeEn = getTextField(formData, "badgeEn");
  const category = validateRequiredText(getTextField(formData, "category"), "Kategori");
  const categoryEn = getTextField(formData, "categoryEn");
  const shortDescription = validateRequiredText(
    getTextField(formData, "shortDescription"),
    "Kisa aciklama",
  );
  const shortDescriptionEn = getTextField(formData, "shortDescriptionEn");
  const description = validateRequiredText(
    getTextField(formData, "description"),
    "Detayli aciklama",
  );
  const descriptionEn = getTextField(formData, "descriptionEn");
  const seoTitle = validateRequiredText(getTextField(formData, "seoTitle"), "SEO basligi");
  const seoTitleEn = getTextField(formData, "seoTitleEn");
  const seoDescription = validateRequiredText(
    getTextField(formData, "seoDescription"),
    "Meta aciklama",
  );
  const seoDescriptionEn = getTextField(formData, "seoDescriptionEn");
  const focusKeyword = validateRequiredText(
    getTextField(formData, "focusKeyword"),
    "Odak anahtar kelime",
  );
  const focusKeywordEn = getTextField(formData, "focusKeywordEn");
  const tourismLicenseNumber = getTextField(formData, "tourismLicenseNumber") || undefined;
  const coverAlt = validateRequiredText(
    getTextField(formData, "coverAlt"),
    "Kapak gorseli alt metni",
  );
  const coverAltEn = getTextField(formData, "coverAltEn");
  const operational = getVillaOperationalInput(formData);

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
  const poolTypeEn = getTextField(formData, "poolTypeEn");
  const featured = getTextField(formData, "featured") === "on";
  const status = parseVillaStatus(getTextField(formData, "status"));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  try { files.push(...await readStagedImages(formData, companyId)); } catch (error) {
    if (error instanceof PanelRecordError) throw new DemoVillaStoreError(error.message); throw error;
  }
  const tourismLicensePdf = getPdfFile(formData);

  validateImageFiles(files, { requireAtLeastOne: status === "ACTIVE" });
  validatePdfFile(tourismLicensePdf);

  if (status === "ACTIVE") await validatePublication(companyId, { imageCount: files.length, nightlyPrice, city, district, tourismLicenseNumber, tourismLicensePdfUrl: tourismLicensePdf ? "pending.pdf" : undefined, titleEn, descriptionEn });

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
        address: operational.address ?? `${district}, ${city}`,
        ownerVillaName: operational.ownerVillaName,
        supplierName: operational.supplierName,
        supplierPhone: operational.supplierPhone,
        supplierEmail: operational.supplierEmail,
        supplierNotes: operational.supplierNotes,
        latitude: operational.latitude,
        longitude: operational.longitude,
        marketDistanceMeters: operational.marketDistanceMeters,
        beachDistanceMeters: operational.beachDistanceMeters,
        centerDistanceMeters: operational.centerDistanceMeters,
        airportDistanceKm: operational.airportDistanceKm,
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
        cleaningFee: operational.cleaningFee,
        electricityFee: operational.electricityFee,
        waterFee: operational.waterFee,
        extraGuestFee: operational.extraGuestFee,
        damageDeposit: operational.damageDeposit,
        extraFeeNotes: operational.extraFeeNotes,
        extraFeeNotesEn: operational.extraFeeNotesEn,
        minNightCount: operational.minNightCount,
        capacity,
        bedroomCount,
        bathroomCount,
        poolType,
        poolTypeEn,
        checkInTime: operational.checkInTime,
        checkOutTime: operational.checkOutTime,
        suitabilityTags: operational.suitabilityTags,
        amenities: operational.amenities,
        houseRules: operational.houseRules,
        houseRulesEn: operational.houseRulesEn,
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
        pricingPeriods: [],
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
          address: operational.address ?? `${district}, ${city}`,
          ownerVillaName: operational.ownerVillaName,
          supplierName: operational.supplierName,
          supplierPhone: operational.supplierPhone,
          supplierEmail: operational.supplierEmail,
          supplierNotes: operational.supplierNotes,
          latitude: operational.latitude,
          longitude: operational.longitude,
          marketDistanceMeters: operational.marketDistanceMeters,
          beachDistanceMeters: operational.beachDistanceMeters,
          centerDistanceMeters: operational.centerDistanceMeters,
          airportDistanceKm: operational.airportDistanceKm,
          capacity,
          bedroomCount,
          bathroomCount,
          poolType,
          poolTypeEn,
          checkInTime: operational.checkInTime,
          checkOutTime: operational.checkOutTime,
          suitabilityTags: operational.suitabilityTags,
          houseRules: operational.houseRules,
          houseRulesEn: operational.houseRulesEn,
          nightlyBasePrice: nightlyPrice,
          cleaningFee: operational.cleaningFee,
          electricityFee: operational.electricityFee,
          waterFee: operational.waterFee,
          extraGuestFee: operational.extraGuestFee,
          damageDeposit: operational.damageDeposit,
          extraFeeNotes: operational.extraFeeNotes,
          extraFeeNotesEn: operational.extraFeeNotesEn,
          minNightCount: operational.minNightCount,
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
          amenities: {
            create: operational.amenities.map((item) => ({
              amenity: {
                connectOrCreate: {
                  where: { key: item.key },
                  create: {
                    key: item.key,
                    label: item.label,
                    category: item.category,
                  },
                },
              },
            })),
          },
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
    address: villa.address ?? undefined,
    ownerVillaName: villa.ownerVillaName ?? undefined,
    supplierName: villa.supplierName ?? undefined,
    supplierPhone: villa.supplierPhone ?? undefined,
    supplierEmail: villa.supplierEmail ?? undefined,
    supplierNotes: villa.supplierNotes ?? undefined,
    latitude: villa.latitude === null ? undefined : decimalToNumber(villa.latitude),
    longitude: villa.longitude === null ? undefined : decimalToNumber(villa.longitude),
    marketDistanceMeters: villa.marketDistanceMeters ?? undefined,
    beachDistanceMeters: villa.beachDistanceMeters ?? undefined,
    centerDistanceMeters: villa.centerDistanceMeters ?? undefined,
    airportDistanceKm: villa.airportDistanceKm ?? undefined,
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
    checkInTime: villa.checkInTime ?? undefined,
    checkOutTime: villa.checkOutTime ?? undefined,
    suitabilityTags: villa.suitabilityTags,
    amenities: operational.amenities,
    houseRules: villa.houseRules,
    houseRulesEn: villa.houseRulesEn,
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
    cleaningFee: decimalToNumber(villa.cleaningFee),
    electricityFee: decimalToNumber(villa.electricityFee),
    waterFee: decimalToNumber(villa.waterFee),
    extraGuestFee: decimalToNumber(villa.extraGuestFee),
    damageDeposit: decimalToNumber(villa.damageDeposit),
    extraFeeNotes: villa.extraFeeNotes ?? undefined,
    extraFeeNotesEn: villa.extraFeeNotesEn ?? undefined,
    minNightCount: villa.minNightCount,
    pricingPeriods: [],
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
      status: true,
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
  const existing = await getDemoVillaBySlug(slug, { ...input, includeMetrics: false });
  if (!existing) throw new DemoVillaStoreError("Villa bulunamadi.");
  await assertPanelCompanyAccess(existing.companyId);
  const title = validateRequiredText(getTextField(formData, "title"), "Villa basligi");
  const titleEn = getTextField(formData, "titleEn");
  const shortCode = validateRequiredText(normalizeShortCode(getTextField(formData, "shortCode")), "Kisa kod");
  const slugInput = getTextField(formData, "slug") || title;
  const nextSlug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(normalizeLocationField(getTextField(formData, "city")), "Lokasyon");
  const district = validateRequiredText(normalizeLocationField(getTextField(formData, "district")), "Bolge");
  const badge = validateRequiredText(getTextField(formData, "badge"), "Vitrin etiketi");
  const badgeEn = getTextField(formData, "badgeEn");
  const category = validateRequiredText(getTextField(formData, "category"), "Kategori");
  const categoryEn = getTextField(formData, "categoryEn");
  const shortDescription = validateRequiredText(
    getTextField(formData, "shortDescription"),
    "Kisa aciklama",
  );
  const shortDescriptionEn = getTextField(formData, "shortDescriptionEn");
  const description = validateRequiredText(
    getTextField(formData, "description"),
    "Detayli aciklama",
  );
  const descriptionEn = getTextField(formData, "descriptionEn");
  const seoTitle = validateRequiredText(getTextField(formData, "seoTitle"), "SEO basligi");
  const seoTitleEn = getTextField(formData, "seoTitleEn");
  const seoDescription = validateRequiredText(
    getTextField(formData, "seoDescription"),
    "Meta aciklama",
  );
  const seoDescriptionEn = getTextField(formData, "seoDescriptionEn");
  const focusKeyword = validateRequiredText(
    getTextField(formData, "focusKeyword"),
    "Odak anahtar kelime",
  );
  const focusKeywordEn = getTextField(formData, "focusKeywordEn");
  const tourismLicenseNumber = getTextField(formData, "tourismLicenseNumber") || undefined;
  const coverAlt = validateRequiredText(
    getTextField(formData, "coverAlt"),
    "Kapak gorseli alt metni",
  );
  const coverAltEn = getTextField(formData, "coverAltEn");
  const operational = getVillaOperationalInput(formData);

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
  const poolTypeEn = getTextField(formData, "poolTypeEn");
  const featured = getTextField(formData, "featured") === "on";
  const status = parseVillaStatus(getTextField(formData, "status"));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const tourismLicensePdf = getPdfFile(formData);

  try { files.push(...await readStagedImages(formData, existing.companyId)); } catch (error) {
    if (error instanceof PanelRecordError) throw new DemoVillaStoreError(error.message); throw error;
  }
  validateImageFiles(files, { requireAtLeastOne: false });
  validatePdfFile(tourismLicensePdf);
  if (status === "ACTIVE") await validatePublication(existing.companyId, { imageCount: existing.imageCount + files.length, nightlyPrice, city, district, tourismLicenseNumber, tourismLicensePdfUrl: tourismLicensePdf ? "pending.pdf" : existing.tourismLicensePdfUrl, titleEn, descriptionEn });

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
      address: operational.address ?? `${district}, ${city}`,
      ownerVillaName: operational.ownerVillaName,
      supplierName: operational.supplierName,
      supplierPhone: operational.supplierPhone,
      supplierEmail: operational.supplierEmail,
      supplierNotes: operational.supplierNotes,
      latitude: operational.latitude,
      longitude: operational.longitude,
      marketDistanceMeters: operational.marketDistanceMeters,
      beachDistanceMeters: operational.beachDistanceMeters,
      centerDistanceMeters: operational.centerDistanceMeters,
      airportDistanceKm: operational.airportDistanceKm,
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
      checkInTime: operational.checkInTime,
      checkOutTime: operational.checkOutTime,
      suitabilityTags: operational.suitabilityTags,
      amenities: operational.amenities,
      houseRules: operational.houseRules,
      houseRulesEn: operational.houseRulesEn,
      cleaningFee: operational.cleaningFee,
      electricityFee: operational.electricityFee,
      waterFee: operational.waterFee,
      extraGuestFee: operational.extraGuestFee,
      damageDeposit: operational.damageDeposit,
      extraFeeNotes: operational.extraFeeNotes,
      extraFeeNotesEn: operational.extraFeeNotesEn,
      minNightCount: operational.minNightCount,
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

    const savedVilla = await saveFallbackVilla(updatedVilla);
    await writePanelAudit({ companyId: current.companyId, entityType: "VILLA", entityId: current.id, action: "VILLA_UPDATED",
      summary: `Villa bilgileri güncellendi. Gecelik fiyat: ${current.nightlyPrice} → ${nightlyPrice} TL. Yayın durumu: ${current.status} → ${status}. Eklenen fotoğraf: ${newImageUrls.length}.` });
    return savedVilla;
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
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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

    await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${current.id} FOR UPDATE`;
    const previous = await tx.villa.findUniqueOrThrow({ where: { id: current.id } });
    await tx.villa.update({
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
        address: operational.address ?? `${district}, ${city}`,
        ownerVillaName: operational.ownerVillaName ?? null,
        supplierName: operational.supplierName ?? null,
        supplierPhone: operational.supplierPhone ?? null,
        supplierEmail: operational.supplierEmail ?? null,
        supplierNotes: operational.supplierNotes ?? null,
        latitude: operational.latitude ?? null,
        longitude: operational.longitude ?? null,
        marketDistanceMeters: operational.marketDistanceMeters ?? null,
        beachDistanceMeters: operational.beachDistanceMeters ?? null,
        centerDistanceMeters: operational.centerDistanceMeters ?? null,
        airportDistanceKm: operational.airportDistanceKm ?? null,
        capacity,
        bedroomCount,
        bathroomCount,
        poolType,
        poolTypeEn,
        checkInTime: operational.checkInTime ?? null,
        checkOutTime: operational.checkOutTime ?? null,
        suitabilityTags: operational.suitabilityTags,
        houseRules: operational.houseRules,
        houseRulesEn: operational.houseRulesEn,
        nightlyBasePrice: nightlyPrice,
        cleaningFee: operational.cleaningFee,
        electricityFee: operational.electricityFee,
        waterFee: operational.waterFee,
        extraGuestFee: operational.extraGuestFee,
        damageDeposit: operational.damageDeposit,
        extraFeeNotes: operational.extraFeeNotes ?? null,
        extraFeeNotesEn: operational.extraFeeNotesEn ?? null,
        minNightCount: operational.minNightCount,
        status,
        featured,
        coverImageUrl: previous.coverImageUrl ?? coverImageUrl,
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
        amenities: {
          deleteMany: {},
          create: operational.amenities.map((item) => ({
            amenity: {
              connectOrCreate: {
                where: { key: item.key },
                create: {
                  key: item.key,
                  label: item.label,
                  category: item.category,
                },
              },
            },
          })),
        },
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

    await writePanelAudit({ companyId: current.companyId, entityType: "VILLA", entityId: current.id, action: "VILLA_UPDATED",
      summary: `Villa bilgileri güncellendi. Gecelik fiyat: ${decimalToNumber(previous.nightlyBasePrice)} → ${nightlyPrice} TL. Yayın durumu: ${previous.status} → ${status}. Eklenen fotoğraf: ${newImageUrls.length}.` }, tx);
    }, { timeout: 60_000, maxWait: 10_000 });
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
  if (status === "ACTIVE") {
    const existing = await getDemoVillaBySlug(slug, { ...input, includeMetrics: false });
    if (!existing) throw new DemoVillaStoreError("Villa bulunamadi.");
    await validatePublication(existing.companyId, existing);
  }
  async function updateFallbackStatus() {
    const villa = await getFallbackVillaForMutation(slug, input);
    const updatedVilla = await updateFallbackVillaStatus(villa.companyId, slug, status);

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id, action: "STATUS_CHANGED", summary: `Yayın durumu: ${villa.status} → ${status}.` });
    return updatedVilla;
  }

  if (isDevelopmentFallbackForced()) {
    return await updateFallbackStatus();
  }

  try {
    const villa = await resolveDbVillaForMutation(slug, input);
    const updated = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villa.id} FOR UPDATE`;
    const previous = await tx.villa.findUniqueOrThrow({ where: { id: villa.id } });
    const updated = await tx.villa.update({
      where: { id: villa.id },
      data: { status },
      include: {
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        availabilityBlocks: {
          orderBy: { startsAt: "asc" },
        },
        dailyMetrics: true,
      },
    });

    await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id, action: "STATUS_CHANGED", summary: `Yayın durumu: ${previous.status} → ${status}.` }, tx);
    return updated;
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
            calendarSourceId: range.calendarSourceId,
            externalEventId: range.externalEventId,
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

async function validatePublication(companyId: string, villa: Parameters<typeof assertPublicationReady>[1]) {
  try { await assertPublicationReady(companyId, villa); }
  catch (error) { if (error instanceof PanelRecordError) throw new DemoVillaStoreError(error.message); throw error; }
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

export async function addDemoVillaPricingPeriod(input: PricingPeriodInput & { slug: string }) {
  function validate(periods: VillaPricingPeriod[]) {
    try {
      validatePricingPeriod(input, periods);
    } catch (error) {
      throw new DemoVillaStoreError(error instanceof Error ? error.message : "Gecersiz fiyat donemi.");
    }
  }

  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const villa = await db.villa.findFirst({
        where: { slug: input.slug, ...(companyId ? { companyId } : {}) },
        select: { id: true, companyId: true },
      });
      if (!villa) throw new DemoVillaStoreError("Villa bulunamadi.");
      await assertPanelCompanyAccess(villa.companyId);
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villa.id} FOR UPDATE`;
        const periods = await tx.villaPricingRule.findMany({
          where: { villaId: villa.id, ruleType: "SEASONAL" },
        });
        validate(periods.map(mapVillaPricingPeriod));
        const data = {
          title: input.title.trim(),
          startsAt: new Date(`${input.startDate}T00:00:00.000Z`),
          endsAt: new Date(`${input.endDate}T23:59:59.999Z`),
          nightlyPrice: input.nightlyPrice,
          cleaningFee: input.cleaningFee ?? null,
          minNightCount: input.minNightCount ?? null,
          isActive: input.active !== false,
        };
        if (input.id) {
          await tx.villaPricingRule.update({ where: { id: input.id }, data });
        } else {
          await tx.villaPricingRule.create({ data: { ...data, villaId: villa.id, ruleType: "SEASONAL" } });
        }
        await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id, action: "SEASONAL_PRICE_CHANGED",
          summary: `${input.id ? "Düzenlenen" : "Eklenen"} fiyat dönemi: ${input.title.trim()}, ${input.startDate} - ${input.endDate}, ${input.nightlyPrice} TL/gece.` }, tx);
      });
      const updated = await getDemoVillaBySlug(input.slug, { companyId: villa.companyId, includeMetrics: false });
      if (!updated) throw new DemoVillaStoreError("Villa tekrar okunamadi.");
      return updated;
    },
    async () => {
      const villa = await getFallbackVillaForMutation(input.slug);
      const periods = villa.pricingPeriods ?? [];
      validate(periods);
      const updated = await saveFallbackVilla({
        ...villa,
        pricingPeriods: sortPricingPeriods([
          ...periods.filter((period) => period.id !== input.id),
          {
            id: input.id ?? `pricing-${randomUUID()}`,
            title: input.title.trim(),
            startDate: input.startDate,
            endDate: input.endDate,
            nightlyPrice: input.nightlyPrice,
            cleaningFee: input.cleaningFee,
            minNightCount: input.minNightCount,
            active: input.active !== false,
          },
        ]),
      });
      await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id, action: "SEASONAL_PRICE_CHANGED",
        summary: `${input.id ? "Düzenlenen" : "Eklenen"} fiyat dönemi: ${input.title.trim()}, ${input.startDate} - ${input.endDate}, ${input.nightlyPrice} TL/gece.` });
      return updated;
    },
  );
}

export async function deleteDemoVillaPricingPeriod(input: {
  slug: string;
  pricingPeriodId: string;
}) {
  async function deleteFallbackPricingPeriod() {
    const villa = await getFallbackVillaForMutation(input.slug);
    const periods = villa.pricingPeriods ?? [];

    if (!periods.some((period) => period.id === input.pricingPeriodId)) {
      throw new DemoVillaStoreError("Silinecek fiyat donemi bulunamadi.");
    }

    const updated = await saveFallbackVilla({
      ...villa,
      pricingPeriods: periods.filter((period) => period.id !== input.pricingPeriodId),
    });
    await writePanelAudit({ companyId: villa.companyId, entityType: "VILLA", entityId: villa.id, action: "SEASONAL_PRICE_CHANGED", summary: `Fiyat dönemi kaldırıldı: ${periods.find(period => period.id === input.pricingPeriodId)?.title}.` });
    return updated;
  }

  if (isDevelopmentFallbackForced()) {
    return deleteFallbackPricingPeriod();
  }

  try {
    const period = await db.villaPricingRule.findFirst({
      where: {
        id: input.pricingPeriodId,
        ruleType: "SEASONAL",
        villa: { slug: input.slug },
      },
      include: { villa: { select: { companyId: true } } },
    });

    if (!period) {
      throw new DemoVillaStoreError("Silinecek fiyat donemi bulunamadi.");
    }

    await assertPanelCompanyAccess(period.villa.companyId);
    await db.$transaction(async tx => {
      await tx.villaPricingRule.delete({ where: { id: period.id } });
      await writePanelAudit({ companyId: period.villa.companyId, entityType: "VILLA", entityId: period.villaId, action: "SEASONAL_PRICE_CHANGED", summary: `Fiyat dönemi kaldırıldı: ${period.title}.` }, tx);
    });

    const updatedVilla = await getDemoVillaBySlug(input.slug, {
      companyId: period.villa.companyId,
      includeMetrics: false,
    });

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Fiyat donemi silindi ancak villa tekrar okunamadi.");
    }

    return updatedVilla;
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return deleteFallbackPricingPeriod();
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
  if (!isDateKey(input.startDate) || !isDateKey(input.endDate)) {
    throw new DemoVillaStoreError("Baslangic ve bitis tarihi zorunludur.");
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
  const exclusiveEnd = shiftDateKey(input.endDate, 1);
  const endDate = new Date(`${exclusiveEnd}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new DemoVillaStoreError("Tarih alani gecerli degil.");
  }

  if (endDate <= startDate) {
    throw new DemoVillaStoreError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
  }

  async function addFallbackAvailability() {
    const villa = await getFallbackVillaForMutation(input.slug);
    const overlap = villa.availabilityRanges.find(
      (range) => input.startDate < range.endDate && exclusiveEnd > range.startDate,
    );

    if (overlap) {
      throw new DemoVillaStoreError(
        `${overlap.startDate} - ${overlap.endDate} araliginda baska bir blok zaten kayitli.`,
      );
    }

    return saveFallbackVilla({
      ...villa,
      availabilityRanges: sortAvailabilityRanges([
        ...villa.availabilityRanges,
        {
          id: `availability-${randomUUID().slice(0, 8)}`,
          startDate: input.startDate,
          endDate: exclusiveEnd,
          label: input.label.trim() || "Manuel blok",
          status: input.status,
          sourceRequestId: input.sourceRequestId,
        },
      ]),
    });
  }

  if (isDevelopmentFallbackForced()) {
    return addFallbackAvailability();
  }

  try {
    const scopedCompanyId = await resolvePanelCompanyId();
    const villa = await db.villa.findFirst({
      where: {
        slug: input.slug,
        ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
      },
      include: {
        availabilityBlocks: true,
      },
    });

    if (!villa) {
      throw new DemoVillaStoreError("Villa bulunamadi.");
    }

    await assertPanelCompanyAccess(villa.companyId);

    const userId = (await getUserSession())?.id;
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${villa.id} FOR UPDATE`;
      const overlap = await tx.villaAvailabilityBlock.findFirst({ where: {
        villaId: villa.id, startsAt: { lt: endDate }, endsAt: { gt: startDate },
      } });
      if (overlap) throw new DemoVillaStoreError("Secilen tarihlerde baska bir blok zaten kayitli.");
      await tx.villaAvailabilityBlock.create({
        data: {
          id: `availability-${randomUUID()}`, villaId: villa.id, createdByUserId: userId,
          startsAt: startDate, endsAt: endDate, blockType: input.status,
          note: input.label.trim() || "Manuel blok", sourceRequestId: input.sourceRequestId,
        },
      });
    });

    const updatedVilla = await getDemoVillaBySlug(input.slug, { companyId: villa.companyId });

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Villa uygunluk kaydi eklendikten sonra okunamadi.");
    }

    return updatedVilla;
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return addFallbackAvailability();
    }

    throw error;
  }
}

export async function deleteDemoVillaAvailability(input: { slug: string; rangeId: string }) {
  async function deleteFallbackAvailability() {
    const villa = await getFallbackVillaForMutation(input.slug);

    if (!villa.availabilityRanges.some((range) => range.id === input.rangeId)) {
      throw new DemoVillaStoreError("Silinecek uygunluk kaydi bulunamadi.");
    }
    if (villa.availabilityRanges.find((range) => range.id === input.rangeId)?.sourceRequestId) {
      throw new DemoVillaStoreError("Rezervasyona bagli bloklar talepler ekranindan iptal edilmelidir.");
    }
    if (villa.availabilityRanges.find((range) => range.id === input.rangeId)?.calendarSourceId) {
      throw new DemoVillaStoreError("iCal bloklari kaynak takvimden yonetilir; kaynagi guncelleyip yeniden senkronize edin.");
    }

    return saveFallbackVilla({
      ...villa,
      availabilityRanges: villa.availabilityRanges.filter((range) => range.id !== input.rangeId),
    });
  }

  if (isDevelopmentFallbackForced()) {
    return deleteFallbackAvailability();
  }

  try {
    const scopedCompanyId = await resolvePanelCompanyId();
    const range = await db.villaAvailabilityBlock.findFirst({
      where: {
        id: input.rangeId,
        villa: {
          slug: input.slug,
          ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
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
    if (range.sourceRequestId) throw new DemoVillaStoreError("Rezervasyona bagli bloklar talepler ekranindan iptal edilmelidir.");
    if (range.calendarSourceId) throw new DemoVillaStoreError("iCal bloklari kaynak takvimden yonetilir; kaynagi guncelleyip yeniden senkronize edin.");
    await db.villaAvailabilityBlock.delete({
      where: { id: range.id },
    });

    const updatedVilla = await getDemoVillaBySlug(input.slug, { companyId: range.villa.companyId });

    if (!updatedVilla) {
      throw new DemoVillaStoreError("Villa uygunluk kaydi silindikten sonra okunamadi.");
    }

    return updatedVilla;
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return deleteFallbackAvailability();
    }

    throw error;
  }
}

export async function deleteDemoVillaAvailabilityByRequestId(input: {
  slug: string;
  requestId: string;
}) {
  async function deleteFallbackRequestAvailability() {
    const villa = await getFallbackVillaForMutation(input.slug);

    return saveFallbackVilla({
      ...villa,
      availabilityRanges: villa.availabilityRanges.filter(
        (range) => range.sourceRequestId !== input.requestId,
      ),
    });
  }

  if (isDevelopmentFallbackForced()) {
    return deleteFallbackRequestAvailability();
  }

  try {
    const scopedCompanyId = await resolvePanelCompanyId();
    const villa = await db.villa.findFirst({
      where: {
        slug: input.slug,
        ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
      },
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
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      return deleteFallbackRequestAvailability();
    }

    throw error;
  }
}
