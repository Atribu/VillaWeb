import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";
import {
  buildSeedRequestEvents,
  DEMO_REFERENCE_DATE,
  type DemoCoupon,
  type DemoDiscountCampaign,
  type DemoPricingRecord,
  type DemoRequest,
  type DemoRequestEvent,
  type RequestStatus,
  getRequestStatusLabel,
  getEligibleCoupon,
  getResolvedStayPricing,
  normalizeCouponCode,
  parseCurrencyLabel,
  REQUEST_STATUS_OPTIONS,
  seedDemoCoupons,
  seedDemoDiscountCampaigns,
  seedDemoPricingRecords,
  seedDemoRequestEvents,
  seedDemoRequests,
} from "@/lib/demo-operations";
import {
  buildOperationTasksForApprovedRequest,
  type DemoOperationTask,
  type DemoOperationTaskStatus,
} from "@/lib/demo-operations-workflow";

const demoDataDirectory = path.join(process.cwd(), "data");
const pricingFilePath = path.join(demoDataDirectory, "demo-pricing.json");
const discountFilePath = path.join(demoDataDirectory, "demo-discounts.json");
const couponFilePath = path.join(demoDataDirectory, "demo-coupons.json");
const requestFilePath = path.join(demoDataDirectory, "demo-requests.json");
const requestEventFilePath = path.join(demoDataDirectory, "demo-request-events.json");
const operationTaskFilePath = path.join(demoDataDirectory, "demo-operation-tasks.json");

export class DemoOperationsStoreError extends Error {}

async function ensureJsonFile<T>(filePath: string, seedData: T) {
  await mkdir(demoDataDirectory, { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, seedData: T): Promise<T> {
  await ensureJsonFile(filePath, seedData);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function getDemoPricingRecords() {
  const pricingRecords = await readJsonFile(pricingFilePath, seedDemoPricingRecords);
  return pricingRecords.sort((left, right) => left.villaSlug.localeCompare(right.villaSlug));
}

export async function getDemoDiscountCampaigns() {
  const discounts = await readJsonFile(discountFilePath, seedDemoDiscountCampaigns);
  return discounts.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoCoupons() {
  const coupons = await readJsonFile(couponFilePath, seedDemoCoupons);
  return coupons.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoRequests() {
  const requests = await readJsonFile(requestFilePath, seedDemoRequests);
  return requests.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoRequestEvents() {
  try {
    await access(requestEventFilePath);
  } catch {
    const requests = await getDemoRequests();
    await writeJsonFile(requestEventFilePath, buildSeedRequestEvents(requests));
  }

  const events = await readJsonFile(requestEventFilePath, seedDemoRequestEvents);
  return events.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoOperationTasks() {
  try {
    await access(operationTaskFilePath);
  } catch {
    const requests = await getDemoRequests();
    const seedTasks = requests
      .filter((request) => request.status === "APPROVED")
      .flatMap((request) => buildOperationTasksForApprovedRequest(request));
    await writeJsonFile(operationTaskFilePath, seedTasks);
  }

  const tasks = await readJsonFile(operationTaskFilePath, [] as DemoOperationTask[]);
  return tasks.sort((left, right) => {
    if (left.scheduledDate === right.scheduledDate) {
      return left.createdAt.localeCompare(right.createdAt);
    }

    return left.scheduledDate.localeCompare(right.scheduledDate);
  });
}

async function appendDemoRequestEvent(event: DemoRequestEvent) {
  const events = await getDemoRequestEvents();
  events.unshift(event);
  await writeJsonFile(requestEventFilePath, events);
}

async function writeDemoOperationTasks(tasks: DemoOperationTask[]) {
  await writeJsonFile(operationTaskFilePath, tasks);
}

export async function getDemoRequestById(requestId: string) {
  const requests = await getDemoRequests();
  return requests.find((request) => request.id === requestId) ?? null;
}

export async function syncOperationTasksForApprovedRequest(request: DemoRequest) {
  const existingTasks = await getDemoOperationTasks();
  const requestTasks = existingTasks.filter((task) => task.requestId === request.id);

  if (requestTasks.length > 0) {
    return requestTasks;
  }

  const nextTasks = buildOperationTasksForApprovedRequest(request);
  await writeDemoOperationTasks([...existingTasks, ...nextTasks]);
  return nextTasks;
}

export async function deleteOperationTasksByRequestId(requestId: string) {
  const tasks = await getDemoOperationTasks();
  const nextTasks = tasks.filter((task) => task.requestId !== requestId);

  if (nextTasks.length === tasks.length) {
    return;
  }

  await writeDemoOperationTasks(nextTasks);
}

export async function updateDemoOperationTaskStatus(
  taskId: string,
  status: DemoOperationTaskStatus,
) {
  const tasks = await getDemoOperationTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    throw new DemoOperationsStoreError("Gorev bulunamadi.");
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    status,
  };

  await writeDemoOperationTasks(tasks);

  return tasks[taskIndex];
}

export async function upsertDemoPricingRecord(input: DemoPricingRecord) {
  if (input.baseNightlyPrice <= 0) {
    throw new DemoOperationsStoreError("Gecelik fiyat sifirdan buyuk olmalidir.");
  }

  if (input.cleaningFee < 0) {
    throw new DemoOperationsStoreError("Temizlik ucreti negatif olamaz.");
  }

  if (input.minNightCount <= 0) {
    throw new DemoOperationsStoreError("Minimum gece en az 1 olmalidir.");
  }

  const pricingRecords = await getDemoPricingRecords();
  const currentIndex = pricingRecords.findIndex((record) => record.villaSlug === input.villaSlug);
  const nextRecord = { ...input, updatedAt: new Date().toISOString() };

  if (currentIndex === -1) {
    pricingRecords.push(nextRecord);
  } else {
    pricingRecords[currentIndex] = nextRecord;
  }

  await writeJsonFile(pricingFilePath, pricingRecords);

  return nextRecord;
}

export async function createDemoDiscountCampaign(
  input: Omit<DemoDiscountCampaign, "id" | "createdAt">,
) {
  if (!input.title.trim()) {
    throw new DemoOperationsStoreError("Kampanya basligi zorunludur.");
  }

  if (input.percentOff <= 0 || input.percentOff >= 100) {
    throw new DemoOperationsStoreError("Indirim orani 1 ile 99 arasinda olmalidir.");
  }

  if (!input.startDate || !input.endDate || input.endDate <= input.startDate) {
    throw new DemoOperationsStoreError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
  }

  const discounts = await getDemoDiscountCampaigns();
  const nextDiscount: DemoDiscountCampaign = {
    ...input,
    id: `discount-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };

  discounts.unshift(nextDiscount);
  await writeJsonFile(discountFilePath, discounts);

  return nextDiscount;
}

export async function updateDemoDiscountCampaign(
  discountId: string,
  input: Partial<Pick<DemoDiscountCampaign, "active">>,
) {
  const discounts = await getDemoDiscountCampaigns();
  const discountIndex = discounts.findIndex((discount) => discount.id === discountId);

  if (discountIndex === -1) {
    throw new DemoOperationsStoreError("Kampanya bulunamadi.");
  }

  discounts[discountIndex] = {
    ...discounts[discountIndex],
    ...input,
  };

  await writeJsonFile(discountFilePath, discounts);

  return discounts[discountIndex];
}

export async function deleteDemoDiscountCampaign(discountId: string) {
  const discounts = await getDemoDiscountCampaigns();
  const nextDiscounts = discounts.filter((discount) => discount.id !== discountId);

  if (nextDiscounts.length === discounts.length) {
    throw new DemoOperationsStoreError("Silinecek kampanya bulunamadi.");
  }

  await writeJsonFile(discountFilePath, nextDiscounts);
}

export async function createDemoCoupon(input: Omit<DemoCoupon, "id" | "createdAt" | "usageCount">) {
  const code = normalizeCouponCode(input.code);

  if (!input.title.trim()) {
    throw new DemoOperationsStoreError("Kupon basligi zorunludur.");
  }

  if (!code) {
    throw new DemoOperationsStoreError("Kupon kodu zorunludur.");
  }

  if (input.percentOff <= 0 || input.percentOff >= 100) {
    throw new DemoOperationsStoreError("Kupon orani 1 ile 99 arasinda olmalidir.");
  }

  if (input.usageLimit <= 0) {
    throw new DemoOperationsStoreError("Kullanim limiti en az 1 olmalidir.");
  }

  if (!input.startDate || !input.endDate || input.endDate <= input.startDate) {
    throw new DemoOperationsStoreError("Bitis tarihi baslangic tarihinden sonra olmalidir.");
  }

  const coupons = await getDemoCoupons();

  if (coupons.some((coupon) => coupon.code === code)) {
    throw new DemoOperationsStoreError("Bu kupon kodu zaten kayitli.");
  }

  const nextCoupon: DemoCoupon = {
    ...input,
    code,
    id: `coupon-${randomUUID().slice(0, 8)}`,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  coupons.unshift(nextCoupon);
  await writeJsonFile(couponFilePath, coupons);

  return nextCoupon;
}

export async function updateDemoCoupon(couponId: string, input: Partial<Pick<DemoCoupon, "active">>) {
  const coupons = await getDemoCoupons();
  const couponIndex = coupons.findIndex((coupon) => coupon.id === couponId);

  if (couponIndex === -1) {
    throw new DemoOperationsStoreError("Kupon bulunamadi.");
  }

  coupons[couponIndex] = {
    ...coupons[couponIndex],
    ...input,
  };

  await writeJsonFile(couponFilePath, coupons);

  return coupons[couponIndex];
}

export async function deleteDemoCoupon(couponId: string) {
  const coupons = await getDemoCoupons();
  const nextCoupons = coupons.filter((coupon) => coupon.id !== couponId);

  if (nextCoupons.length === coupons.length) {
    throw new DemoOperationsStoreError("Silinecek kupon bulunamadi.");
  }

  await writeJsonFile(couponFilePath, nextCoupons);
}

export async function validateDemoCoupon(input: {
  code: string;
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
}) {
  const [pricingRecords, discounts, coupons] = await Promise.all([
    getDemoPricingRecords(),
    getDemoDiscountCampaigns(),
    getDemoCoupons(),
  ]);
  const coupon = getEligibleCoupon(coupons, {
    code: input.code,
    villaSlug: input.villa.slug,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  if (!coupon) {
    throw new DemoOperationsStoreError(
      "Kupon aktif degil, tarih araligina uymuyor veya kullanim limitine ulasmis.",
    );
  }

  return getResolvedStayPricing({
    villa: input.villa,
    pricingRecords,
    discounts,
    coupons,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    couponCode: coupon.code,
  });
}

export async function createDemoRequest(input: {
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  fullName: string;
  phone: string;
  email: string;
  message: string;
  couponCode?: string;
  origin?: "PUBLIC_FORM" | "MANUAL_PANEL";
  actorLabel?: string;
}) {
  const [pricingRecords, discounts, coupons, requests] = await Promise.all([
    getDemoPricingRecords(),
    getDemoDiscountCampaigns(),
    getDemoCoupons(),
    getDemoRequests(),
  ]);
  const resolved = getResolvedStayPricing({
    villa: input.villa,
    pricingRecords,
    discounts,
    coupons,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    couponCode: input.couponCode,
  });
  const normalizedCouponCode = normalizeCouponCode(input.couponCode ?? "");

  if (normalizedCouponCode && !resolved.coupon) {
    throw new DemoOperationsStoreError("Kupon kodu bu talep icin gecerli degil.");
  }

  const createdRequest: DemoRequest = {
    id: `request-${randomUUID().slice(0, 8)}`,
    villaSlug: input.villa.slug,
    villaTitle: input.villa.title,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestCount: input.guestCount,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    couponCode: resolved.coupon?.code,
    origin: input.origin ?? "PUBLIC_FORM",
    status: "NEW",
    createdAt: new Date().toISOString(),
    pricing: resolved.pricing,
  };

  requests.unshift(createdRequest);
  await writeJsonFile(requestFilePath, requests);
  await appendDemoRequestEvent({
    id: `event-${randomUUID().slice(0, 8)}`,
    requestId: createdRequest.id,
    villaSlug: createdRequest.villaSlug,
    villaTitle: createdRequest.villaTitle,
    eventType: "CREATED",
    status: createdRequest.status,
    title:
      createdRequest.origin === "MANUAL_PANEL"
        ? "Panelden yeni rezervasyon kaydi acildi"
        : "Public formdan yeni talep olustu",
    detail: `${createdRequest.fullName} icin ${createdRequest.checkIn} - ${createdRequest.checkOut} araliginda ${createdRequest.guestCount} misafirlik kayit acildi.`,
    actorLabel: input.actorLabel ?? (createdRequest.origin === "MANUAL_PANEL" ? "Panel kullanicisi" : "Public form"),
    origin: createdRequest.origin ?? "PUBLIC_FORM",
    createdAt: createdRequest.createdAt,
  });

  if (resolved.coupon) {
    const nextCoupons = coupons.map((coupon) =>
      coupon.id === resolved.coupon?.id
        ? {
            ...coupon,
            usageCount: coupon.usageCount + 1,
          }
        : coupon,
    );

    await writeJsonFile(couponFilePath, nextCoupons);
  }

  return createdRequest;
}

export async function updateDemoRequestStatus(requestId: string, status: RequestStatus) {
  const requests = await getDemoRequests();
  const requestIndex = requests.findIndex((request) => request.id === requestId);

  if (requestIndex === -1) {
    throw new DemoOperationsStoreError("Guncellenecek talep bulunamadi.");
  }

  const previousStatus = requests[requestIndex].status;
  requests[requestIndex] = {
    ...requests[requestIndex],
    status,
  };

  await writeJsonFile(requestFilePath, requests);
  await appendDemoRequestEvent({
    id: `event-${randomUUID().slice(0, 8)}`,
    requestId: requests[requestIndex].id,
    villaSlug: requests[requestIndex].villaSlug,
    villaTitle: requests[requestIndex].villaTitle,
    eventType: "STATUS_CHANGED",
    status,
    title: "Talep durumu guncellendi",
    detail: `${requests[requestIndex].fullName} kaydi ${getRequestStatusLabel(
      previousStatus,
    )} durumundan ${getRequestStatusLabel(status)} durumuna alindi.`,
    actorLabel: "Operasyon ekibi",
    origin: requests[requestIndex].origin ?? "PUBLIC_FORM",
    createdAt: new Date().toISOString(),
  });

  return requests[requestIndex];
}

export function buildDemoReports(input: {
  villas: CatalogVilla[];
  requests: DemoRequest[];
  coupons: DemoCoupon[];
  discounts: DemoDiscountCampaign[];
}) {
  const approvedRequests = input.requests.filter((request) => request.status === "APPROVED");
  const liveRequests = input.requests.filter((request) => request.status !== "CANCELLED");
  const totalPipelineValue = input.requests.reduce(
    (sum, request) => sum + request.pricing.grandTotal,
    0,
  );
  const approvedRevenue = approvedRequests.reduce(
    (sum, request) => sum + request.pricing.grandTotal,
    0,
  );
  const totalCouponUsage = input.coupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);
  const topViewedVilla =
    [...input.villas].sort((left, right) => right.viewCount - left.viewCount)[0] ?? null;
  const topRequestedVilla =
    [...input.villas].sort((left, right) => right.requestCount - left.requestCount)[0] ?? null;
  const topRevenueVilla =
    [...input.villas].sort(
      (left, right) => parseCurrencyLabel(right.revenueLabel) - parseCurrencyLabel(left.revenueLabel),
    )[0] ?? null;

  const requestDistribution = Object.fromEntries(
    REQUEST_STATUS_OPTIONS.map((option) => [
      option.value,
      input.requests.filter((request) => request.status === option.value).length,
    ]),
  ) as Record<RequestStatus, number>;

  const revenueByVilla = input.villas
    .map((villa) => ({
      villaSlug: villa.slug,
      title: villa.title,
      totalRevenue:
        parseCurrencyLabel(villa.revenueLabel) +
        approvedRequests
          .filter((request) => request.villaSlug === villa.slug)
          .reduce((sum, request) => sum + request.pricing.grandTotal, 0),
      totalRequests: liveRequests.filter((request) => request.villaSlug === villa.slug).length,
      totalViews: villa.viewCount,
    }))
    .sort((left, right) => right.totalRevenue - left.totalRevenue);

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(`${DEMO_REFERENCE_DATE}T12:00:00`);
    monthDate.setMonth(monthDate.getMonth() - (5 - index));
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      year: "numeric",
    }).format(monthDate);

    const monthRequests = input.requests.filter((request) => request.createdAt.startsWith(monthKey));
    const monthRevenue = monthRequests
      .filter((request) => request.status === "APPROVED")
      .reduce((sum, request) => sum + request.pricing.grandTotal, 0);

    return {
      monthKey,
      monthLabel,
      requestCount: monthRequests.length,
      approvedRevenue: monthRevenue,
    };
  });

  return {
    summaryCards: [
      {
        label: "Toplam talep",
        value: String(input.requests.length),
        detail: `${requestDistribution.NEW} yeni, ${requestDistribution.APPROVED} onayli`,
      },
      {
        label: "Acik pipeline",
        value: formatCurrency(totalPipelineValue),
        detail: `${liveRequests.length} aktif talep`,
      },
      {
        label: "Onayli gelir",
        value: formatCurrency(approvedRevenue),
        detail: `${approvedRequests.length} onayli kayit`,
      },
      {
        label: "Kupon kullanimi",
        value: String(totalCouponUsage),
        detail: `${input.coupons.filter((coupon) => coupon.active).length} aktif kupon`,
      },
    ],
    topMetrics: {
      topViewedVilla,
      topRequestedVilla,
      topRevenueVilla,
      activeDiscountCount: input.discounts.filter((discount) => discount.active).length,
    },
    requestDistribution,
    revenueByVilla,
    monthlyTrend,
  };
}
