import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  VILLA_IMAGE_RULES,
  type AvailabilityRange,
  chooseCoverGradient,
  formatCurrency,
  normalizeVillaSlug,
  seedVillaCatalog,
  type CatalogVilla,
} from "@/lib/villa-catalog";
import { getResolvedVillaPricing, parseCurrencyLabel } from "@/lib/demo-operations";
import {
  getDemoDiscountCampaigns,
  getDemoPricingRecords,
  getDemoRequests,
} from "@/lib/server/demo-operations-store";

const demoDataDirectory = path.join(process.cwd(), "data");
const demoVillaFilePath = path.join(demoDataDirectory, "demo-villas.json");
const demoUploadDirectory = path.join(process.cwd(), "public", "uploads", "villas");

export class DemoVillaStoreError extends Error {}

async function ensureDemoVillaStore() {
  await mkdir(demoDataDirectory, { recursive: true });
  await mkdir(demoUploadDirectory, { recursive: true });

  try {
    await access(demoVillaFilePath);
  } catch {
    await writeFile(demoVillaFilePath, JSON.stringify(seedVillaCatalog, null, 2), "utf8");
  }
}

async function saveDemoVillas(villas: CatalogVilla[]) {
  await writeFile(demoVillaFilePath, JSON.stringify(villas, null, 2), "utf8");
}

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

async function getStoredDemoVillas() {
  await ensureDemoVillaStore();
  const raw = await readFile(demoVillaFilePath, "utf8");
  const villas = (JSON.parse(raw) as CatalogVilla[]).map((villa) => ({
    ...villa,
    availabilityRanges: sortAvailabilityRanges(villa.availabilityRanges ?? []),
  }));

  return villas.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function getDemoVillas() {
  const [villas, pricingRecords, discountCampaigns, requests] = await Promise.all([
    getStoredDemoVillas(),
    getDemoPricingRecords(),
    getDemoDiscountCampaigns(),
    getDemoRequests(),
  ]);

  return villas.map((villa) => {
    const resolvedPricing = getResolvedVillaPricing(villa, pricingRecords, discountCampaigns);
    const liveRequestCount = requests.filter(
      (request) => request.villaSlug === villa.slug && request.status !== "CANCELLED",
    ).length;
    const approvedRevenue = requests
      .filter((request) => request.villaSlug === villa.slug && request.status === "APPROVED")
      .reduce((sum, request) => sum + request.pricing.grandTotal, 0);

    return {
      ...villa,
      nightlyPrice: resolvedPricing.baseNightlyPrice,
      discountedNightlyPrice: resolvedPricing.discountedNightlyPrice,
      cleaningFee: resolvedPricing.cleaningFee,
      minNightCount: resolvedPricing.minNightCount,
      activeDiscountTitle: resolvedPricing.activeDiscount?.title,
      activeDiscountPercent: resolvedPricing.activeDiscount?.percentOff,
      requestCount: villa.requestCount + liveRequestCount,
      revenueLabel: formatCurrency(parseCurrencyLabel(villa.revenueLabel) + approvedRevenue),
    } satisfies CatalogVilla;
  });
}

export async function getDemoVillaBySlug(slug: string) {
  const villas = await getDemoVillas();
  return villas.find((villa) => villa.slug === slug) ?? null;
}

export async function createDemoVillaFromFormData(formData: FormData) {
  await ensureDemoVillaStore();

  const title = validateRequiredText(getTextField(formData, "title"), "Villa basligi");
  const slugInput = getTextField(formData, "slug") || title;
  const slug = normalizeVillaSlug(slugInput);
  const city = validateRequiredText(getTextField(formData, "city"), "Sehir");
  const district = validateRequiredText(getTextField(formData, "district"), "Ilce");
  const badge = validateRequiredText(getTextField(formData, "badge"), "Vitrin etiketi");
  const category = validateRequiredText(getTextField(formData, "category"), "Kategori");
  const shortDescription = validateRequiredText(
    getTextField(formData, "shortDescription"),
    "Kisa aciklama",
  );
  const description = validateRequiredText(
    getTextField(formData, "description"),
    "Detayli aciklama",
  );
  const seoTitle = validateRequiredText(getTextField(formData, "seoTitle"), "SEO basligi");
  const seoDescription = validateRequiredText(
    getTextField(formData, "seoDescription"),
    "Meta aciklama",
  );
  const focusKeyword = validateRequiredText(
    getTextField(formData, "focusKeyword"),
    "Odak anahtar kelime",
  );
  const coverAlt = validateRequiredText(
    getTextField(formData, "coverAlt"),
    "Kapak gorseli alt metni",
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
  const featured = getTextField(formData, "featured") === "on";
  const status = getTextField(formData, "status") === "DRAFT" ? "DRAFT" : "ACTIVE";
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  validateImageFiles(files);

  const existingVillas = await getStoredDemoVillas();

  if (existingVillas.some((villa) => villa.slug === slug)) {
    throw new DemoVillaStoreError("Bu slug zaten kullaniliyor. Lutfen farkli bir slug gir.");
  }

  const villaUploadDirectory = path.join(demoUploadDirectory, slug);
  await mkdir(villaUploadDirectory, { recursive: true });

  const imageUrls: string[] = [];

  for (const [index, file] of files.entries()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBaseName = sanitizeFileName(file.name) || `villa-gorsel-${index + 1}`;
    const fileName = `${String(index + 1).padStart(2, "0")}-${fileBaseName}.webp`;
    const targetPath = path.join(villaUploadDirectory, fileName);
    await writeFile(targetPath, buffer);
    imageUrls.push(`/uploads/villas/${slug}/${fileName}`);
  }

  const createdAt = new Date().toISOString();
  const createdVilla: CatalogVilla = {
    id: `villa-${randomUUID().slice(0, 8)}`,
    title,
    slug,
    locationLabel: `${district}, ${city}`,
    city,
    district,
    badge,
    category,
    status,
    featured,
    shortDescription,
    description,
    nightlyPrice,
    discountedNightlyPrice,
    capacity,
    bedroomCount,
    bathroomCount,
    poolType,
    imageCount: imageUrls.length,
    imageUrls,
    coverImageUrl: imageUrls[0],
    coverGradient: chooseCoverGradient(existingVillas.length),
    seoTitle,
    seoDescription,
    focusKeyword,
    coverAlt,
    viewCount: 0,
    requestCount: 0,
    revenueLabel: formatCurrency(0),
    createdAt,
    availabilityRanges: [],
  };

  await saveDemoVillas([createdVilla, ...existingVillas]);

  return createdVilla;
}

export async function addDemoVillaAvailability(input: {
  slug: string;
  startDate: string;
  endDate: string;
  label: string;
  status: AvailabilityRange["status"];
  sourceRequestId?: string;
}) {
  const villas = await getStoredDemoVillas();
  const villaIndex = villas.findIndex((villa) => villa.slug === input.slug);

  if (villaIndex === -1) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  if (!input.startDate || !input.endDate) {
    throw new DemoVillaStoreError("Baslangic ve bitis tarihi zorunludur.");
  }

  const startDate = new Date(`${input.startDate}T00:00:00`);
  const endDate = new Date(`${input.endDate}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new DemoVillaStoreError("Tarih alani gecerli degil.");
  }

  if (endDate <= startDate) {
    throw new DemoVillaStoreError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
  }

  const villa = villas[villaIndex];
  const existingRanges = villa.availabilityRanges ?? [];
  const overlaps = existingRanges.find((range) => {
    const rangeStart = new Date(`${range.startDate}T00:00:00`);
    const rangeEnd = new Date(`${range.endDate}T00:00:00`);

    return startDate < rangeEnd && endDate > rangeStart;
  });

  if (overlaps) {
    throw new DemoVillaStoreError(
      `${overlaps.startDate} - ${overlaps.endDate} araliginda baska bir blok zaten kayitli.`,
    );
  }

  const nextRange: AvailabilityRange = {
    id: `availability-${randomUUID().slice(0, 8)}`,
    startDate: input.startDate,
    endDate: input.endDate,
    label: input.label.trim() || "Manuel blok",
    status: input.status,
    sourceRequestId: input.sourceRequestId,
  };

  const updatedVilla: CatalogVilla = {
    ...villa,
    availabilityRanges: sortAvailabilityRanges([...existingRanges, nextRange]),
  };

  villas[villaIndex] = updatedVilla;
  await saveDemoVillas(villas);

  return updatedVilla;
}

export async function deleteDemoVillaAvailability(input: { slug: string; rangeId: string }) {
  const villas = await getStoredDemoVillas();
  const villaIndex = villas.findIndex((villa) => villa.slug === input.slug);

  if (villaIndex === -1) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  const villa = villas[villaIndex];
  const nextRanges = (villa.availabilityRanges ?? []).filter((range) => range.id !== input.rangeId);

  if (nextRanges.length === (villa.availabilityRanges ?? []).length) {
    throw new DemoVillaStoreError("Silinecek uygunluk kaydi bulunamadi.");
  }

  villas[villaIndex] = {
    ...villa,
    availabilityRanges: sortAvailabilityRanges(nextRanges),
  };

  await saveDemoVillas(villas);

  return villas[villaIndex];
}

export async function deleteDemoVillaAvailabilityByRequestId(input: {
  slug: string;
  requestId: string;
}) {
  const villas = await getStoredDemoVillas();
  const villaIndex = villas.findIndex((villa) => villa.slug === input.slug);

  if (villaIndex === -1) {
    throw new DemoVillaStoreError("Villa bulunamadi.");
  }

  const villa = villas[villaIndex];
  const existingRanges = villa.availabilityRanges ?? [];

  const nextRanges = existingRanges.filter(
    (range) => range.sourceRequestId !== input.requestId || range.status !== "RESERVED",
  );

  // Idempotent davranış: zaten yoksa hata fırlatma.
  villas[villaIndex] = {
    ...villa,
    availabilityRanges: sortAvailabilityRanges(nextRanges),
  };

  await saveDemoVillas(villas);

  return villas[villaIndex];
}
