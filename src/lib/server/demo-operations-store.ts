import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { formatCurrency, normalizeVillaSlug, type CatalogVilla } from "@/lib/villa-catalog";
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
} from "@/lib/demo-operations";
import {
  buildOperationTasksForApprovedRequest,
  type DemoOperationTask,
  type DemoOperationTaskStatus,
} from "@/lib/demo-operations-workflow";
import {
  assertPanelCompanyAccess,
  resolvePanelCompanyId,
} from "@/lib/server/demo-company-context";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import {
  dateKey,
  decimalToNumber,
  getDefaultCompanyId,
  getPrimaryWebsiteIdForCompany,
  mapBookingStatusToDemo,
  mapCampaignStatusToActive,
  mapCouponStatusToActive,
  mapDemoOperationStatusToPrisma,
  mapDemoOriginToSource,
  mapDemoStatusToBooking,
  mapOperationStatusToDemo,
  mapRequestSourceToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoOperationsStoreError extends Error {}

async function queryScopedVillas(input?: { companyId?: string | null; includeAll?: boolean }) {
  const companyId = await resolvePanelCompanyId(input);

  return db.villa.findMany({
    where: companyId ? { companyId } : undefined,
    select: {
      id: true,
      companyId: true,
      slug: true,
      title: true,
      nightlyBasePrice: true,
      cleaningFee: true,
      minNightCount: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDemoPricingRecords(input?: {
  companyId?: string | null;
  includeAll?: boolean;
}) {
  const villas = await queryScopedVillas(input);

  return villas
    .map((villa) => ({
      companyId: villa.companyId,
      villaSlug: villa.slug,
      baseNightlyPrice: decimalToNumber(villa.nightlyBasePrice),
      cleaningFee: decimalToNumber(villa.cleaningFee),
      minNightCount: villa.minNightCount,
      updatedAt: DEMO_REFERENCE_DATE,
    }) satisfies DemoPricingRecord)
    .sort((left, right) => left.villaSlug.localeCompare(right.villaSlug));
}

export async function getDemoDiscountCampaigns(input?: {
  companyId?: string | null;
  includeAll?: boolean;
}) {
  const companyId = await resolvePanelCompanyId(input);
  const campaigns = await db.campaign.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villas: {
        include: {
          villa: {
            select: { slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    companyId: campaign.companyId,
    title: campaign.name,
    villaScope: campaign.villas[0]?.villa.slug ?? "ALL",
    percentOff: decimalToNumber(campaign.discountValue),
    startDate: dateKey(campaign.startsAt),
    endDate: dateKey(campaign.endsAt),
    note: campaign.note ?? "",
    active: mapCampaignStatusToActive(campaign.status),
    createdAt: campaign.createdAt.toISOString(),
  })) satisfies DemoDiscountCampaign[];
}

export async function getDemoCoupons(input?: { companyId?: string | null; includeAll?: boolean }) {
  const companyId = await resolvePanelCompanyId(input);
  const coupons = await db.coupon.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villas: {
        include: {
          villa: {
            select: { slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return coupons.map((coupon) => ({
    id: coupon.id,
    companyId: coupon.companyId,
    title: coupon.title,
    code: coupon.code,
    villaScope: coupon.villas[0]?.villa.slug ?? "ALL",
    percentOff: decimalToNumber(coupon.discountValue),
    startDate: dateKey(coupon.startsAt),
    endDate: dateKey(coupon.endsAt),
    usageLimit: coupon.usageLimit ?? 9999,
    usageCount: coupon.usedCount,
    active: mapCouponStatusToActive(coupon.status),
    createdAt: coupon.createdAt.toISOString(),
  })) satisfies DemoCoupon[];
}

async function mapBookingRequestsToDemoRequests(
  requests: Array<{
    id: string;
    companyId: string;
    status: import("@prisma/client").BookingRequestStatus;
    source: import("@prisma/client").RequestSource;
    fullName: string;
    phone: string;
    email: string | null;
    guestCount: number;
    checkIn: Date;
    checkOut: Date;
    message: string | null;
    couponCodeText: string | null;
    quotedBaseAmount: { toNumber(): number } | null;
    quotedCleaningFee: { toNumber(): number } | null;
    quotedTotalAmount: { toNumber(): number } | null;
    createdAt: Date;
    villa: {
      slug: string;
      title: string;
    };
  }>,
  options?: { companyId?: string | null; includeAll?: boolean },
) {
  const [pricingRecords, discounts, coupons] = await Promise.all([
    getDemoPricingRecords(options),
    getDemoDiscountCampaigns(options),
    getDemoCoupons(options),
  ]);

  const villaCache = new Map<string, CatalogVilla | null>();

  const demoRequests: DemoRequest[] = [];

  for (const request of requests) {
    let catalogVilla = villaCache.get(request.villa.slug);

    if (catalogVilla === undefined) {
      catalogVilla = await getDemoVillaBySlug(request.villa.slug, {
        companyId: request.companyId,
      });
      villaCache.set(request.villa.slug, catalogVilla);
    }

    if (!catalogVilla) {
      continue;
    }

    const resolved = getResolvedStayPricing({
      villa: catalogVilla,
      pricingRecords,
      discounts,
      coupons,
      checkIn: dateKey(request.checkIn),
      checkOut: dateKey(request.checkOut),
      couponCode: request.couponCodeText ?? undefined,
    });

    const pricing = {
      ...resolved.pricing,
      subtotal: request.quotedBaseAmount
        ? decimalToNumber(request.quotedBaseAmount)
        : resolved.pricing.subtotal,
      cleaningFee: request.quotedCleaningFee
        ? decimalToNumber(request.quotedCleaningFee)
        : resolved.pricing.cleaningFee,
      grandTotal: request.quotedTotalAmount
        ? decimalToNumber(request.quotedTotalAmount)
        : resolved.pricing.grandTotal,
      couponCode: request.couponCodeText ?? resolved.pricing.couponCode,
    };

    demoRequests.push({
      id: request.id,
      companyId: request.companyId,
      villaSlug: request.villa.slug,
      villaTitle: request.villa.title,
      checkIn: dateKey(request.checkIn),
      checkOut: dateKey(request.checkOut),
      guestCount: request.guestCount,
      fullName: request.fullName,
      phone: request.phone,
      email: request.email ?? "",
      message: request.message ?? "",
      couponCode: request.couponCodeText ?? undefined,
      origin: mapRequestSourceToDemo(request.source),
      status: mapBookingStatusToDemo(request.status),
      createdAt: request.createdAt.toISOString(),
      pricing,
    });
  }

  return demoRequests.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoRequests(input?: { companyId?: string | null; includeAll?: boolean }) {
  const companyId = await resolvePanelCompanyId(input);
  const requests = await db.bookingRequest.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return mapBookingRequestsToDemoRequests(requests, input);
}

export async function getDemoRequestEvents(input?: {
  companyId?: string | null;
  includeAll?: boolean;
}) {
  const companyId = await resolvePanelCompanyId(input);
  const [requests, histories] = await Promise.all([
    getDemoRequests(input),
    db.bookingRequestStatusHistory.findMany({
      where: companyId
        ? {
            bookingRequest: {
              companyId,
            },
          }
        : undefined,
      include: {
        bookingRequest: {
          select: {
            id: true,
            companyId: true,
            villa: {
              select: {
                slug: true,
                title: true,
              },
            },
            source: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const createdEvents = buildSeedRequestEvents(requests).filter((event) => event.eventType === "CREATED");
  const statusEvents: DemoRequestEvent[] = histories.map((history) => ({
    id: history.id,
    companyId: history.bookingRequest.companyId,
    requestId: history.bookingRequestId,
    villaSlug: history.bookingRequest.villa.slug,
    villaTitle: history.bookingRequest.villa.title,
    eventType: "STATUS_CHANGED",
    status: mapBookingStatusToDemo(history.newStatus),
    title: "Talep durumu guncellendi",
    detail:
      history.note ??
      `${history.bookingRequest.fullName} kaydi ${getRequestStatusLabel(
        mapBookingStatusToDemo(history.newStatus),
      )} durumuna alindi.`,
    actorLabel: "Operasyon ekibi",
    origin: mapRequestSourceToDemo(history.bookingRequest.source),
    createdAt: history.createdAt.toISOString(),
  }));

  return [...createdEvents, ...statusEvents].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function getDemoOperationTasks(input?: {
  companyId?: string | null;
  includeAll?: boolean;
}) {
  const companyId = await resolvePanelCompanyId(input);
  const tasks = await db.operationTask.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      bookingRequest: {
        select: {
          id: true,
          fullName: true,
        },
      },
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    companyId: task.companyId,
    requestId: task.bookingRequestId ?? "",
    villaSlug: task.villa?.slug ?? "",
    villaTitle: task.villa?.title ?? "-",
    guestName: task.bookingRequest?.fullName ?? "-",
    taskType: task.taskType,
    title: task.title,
    detail: task.detail ?? "",
    scheduledDate: dateKey(task.scheduledAt),
    scheduledTimeLabel: task.scheduledTimeLabel ?? "Planlandi",
    assignee: task.assigneeLabel ?? "Operasyon Ekibi",
    supplierName: task.supplierName ?? undefined,
    priority: task.priority,
    status: mapOperationStatusToDemo(task.status),
    source: task.sourceLabel === "MANUAL" ? "MANUAL" : "AUTO_RESERVATION",
    createdAt: task.createdAt.toISOString(),
  })) satisfies DemoOperationTask[];
}

export async function getDemoRequestById(requestId: string) {
  const requests = await getDemoRequests();
  return requests.find((request) => request.id === requestId) ?? null;
}

export async function syncOperationTasksForApprovedRequest(request: DemoRequest) {
  const existingTasks = await db.operationTask.findMany({
    where: { bookingRequestId: request.id },
    select: { id: true },
  });

  if (existingTasks.length > 0) {
    return getDemoOperationTasks({ companyId: request.companyId }).then((tasks) =>
      tasks.filter((task) => task.requestId === request.id),
    );
  }

  const bookingRequest = await db.bookingRequest.findUnique({
    where: { id: request.id },
    include: {
      villa: true,
    },
  });

  if (!bookingRequest) {
    throw new DemoOperationsStoreError("Onayli talep bulunamadi.");
  }

  const nextTasks = buildOperationTasksForApprovedRequest(request);

  await db.$transaction(
    nextTasks.map((task) =>
      db.operationTask.create({
        data: {
          id: task.id,
          companyId: task.companyId,
          bookingRequestId: bookingRequest.id,
          villaId: bookingRequest.villaId,
          taskType: task.taskType,
          status: mapDemoOperationStatusToPrisma(task.status),
          priority: task.priority,
          title: task.title,
          detail: task.detail,
          scheduledAt: new Date(`${task.scheduledDate}T12:00:00.000Z`),
          scheduledTimeLabel: task.scheduledTimeLabel,
          assigneeLabel: task.assignee,
          supplierName: task.supplierName,
          sourceLabel: task.source,
          completedAt: task.status === "DONE" ? new Date() : null,
        },
      }),
    ),
  );

  return getDemoOperationTasks({ companyId: request.companyId }).then((tasks) =>
    tasks.filter((task) => task.requestId === request.id),
  );
}

export async function deleteOperationTasksByRequestId(requestId: string) {
  await db.operationTask.deleteMany({
    where: { bookingRequestId: requestId },
  });
}

export async function updateDemoOperationTaskStatus(
  taskId: string,
  status: DemoOperationTaskStatus,
) {
  const task = await db.operationTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      companyId: true,
    },
  });

  if (!task) {
    throw new DemoOperationsStoreError("Gorev bulunamadi.");
  }

  await assertPanelCompanyAccess(task.companyId);

  await db.operationTask.update({
    where: { id: taskId },
    data: {
      status: mapDemoOperationStatusToPrisma(status),
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  const tasks = await getDemoOperationTasks({ companyId: task.companyId });
  const updated = tasks.find((item) => item.id === taskId);

  if (!updated) {
    throw new DemoOperationsStoreError("Guncel operasyon gorevi okunamadi.");
  }

  return updated;
}

export async function upsertDemoPricingRecord(
  input: Omit<DemoPricingRecord, "companyId"> & {
    companyId?: string;
  },
) {
  if (input.baseNightlyPrice <= 0) {
    throw new DemoOperationsStoreError("Gecelik fiyat sifirdan buyuk olmalidir.");
  }

  if (input.cleaningFee < 0) {
    throw new DemoOperationsStoreError("Temizlik ucreti negatif olamaz.");
  }

  if (input.minNightCount <= 0) {
    throw new DemoOperationsStoreError("Minimum gece en az 1 olmalidir.");
  }

  const villa = await db.villa.findFirst({
    where: {
      slug: input.villaSlug,
      ...(input.companyId ? { companyId: input.companyId } : {}),
    },
    select: {
      id: true,
      companyId: true,
    },
  });

  if (!villa) {
    throw new DemoOperationsStoreError("Fiyat guncellenecek villa bulunamadi.");
  }

  await assertPanelCompanyAccess(villa.companyId);

  await db.villa.update({
    where: { id: villa.id },
    data: {
      nightlyBasePrice: input.baseNightlyPrice,
      cleaningFee: input.cleaningFee,
      minNightCount: input.minNightCount,
    },
  });

  return {
    ...input,
    companyId: villa.companyId,
    updatedAt: new Date().toISOString(),
  } satisfies DemoPricingRecord;
}

export async function createDemoDiscountCampaign(
  input: Omit<DemoDiscountCampaign, "id" | "createdAt" | "companyId"> & {
    companyId?: string;
  },
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

  const companyId = input.companyId ?? (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());

  if (!companyId) {
    throw new DemoOperationsStoreError("Kampanya icin firma scope belirlenemedi.");
  }

  await assertPanelCompanyAccess(companyId);

  const websiteId = await getPrimaryWebsiteIdForCompany(companyId);

  const created = await db.campaign.create({
    data: {
      companyId,
      websiteId,
      createdByUserId: null,
      name: input.title.trim(),
      slug: normalizeVillaSlug(input.title),
      status: input.active ? "ACTIVE" : "PAUSED",
      discountMethod: "PERCENTAGE",
      discountValue: input.percentOff,
      startsAt: new Date(`${input.startDate}T00:00:00.000Z`),
      endsAt: new Date(`${input.endDate}T23:59:59.999Z`),
      bannerLabel: input.title.trim(),
      note: input.note.trim(),
      villas:
        input.villaScope === "ALL"
          ? undefined
          : {
              create: {
                villa: {
                  connect: {
                    companyId_slug: {
                      companyId,
                      slug: input.villaScope,
                    },
                  },
                },
              },
            },
    },
    include: {
      villas: {
        include: { villa: { select: { slug: true } } },
      },
    },
  });

  return {
    id: created.id,
    companyId: created.companyId,
    title: created.name,
    villaScope: created.villas[0]?.villa.slug ?? "ALL",
    percentOff: decimalToNumber(created.discountValue),
    startDate: dateKey(created.startsAt),
    endDate: dateKey(created.endsAt),
    note: created.note ?? "",
    active: mapCampaignStatusToActive(created.status),
    createdAt: created.createdAt.toISOString(),
  } satisfies DemoDiscountCampaign;
}

export async function updateDemoDiscountCampaign(
  discountId: string,
  input: Partial<Pick<DemoDiscountCampaign, "active">>,
) {
  const current = await db.campaign.findUnique({
    where: { id: discountId },
    select: { id: true, companyId: true },
  });

  if (!current) {
    throw new DemoOperationsStoreError("Kampanya bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  await db.campaign.update({
    where: { id: discountId },
    data: {
      status: input.active ? "ACTIVE" : "PAUSED",
    },
  });

  const discounts = await getDemoDiscountCampaigns({ companyId: current.companyId });
  const updated = discounts.find((discount) => discount.id === discountId);

  if (!updated) {
    throw new DemoOperationsStoreError("Guncel kampanya okunamadi.");
  }

  return updated;
}

export async function deleteDemoDiscountCampaign(discountId: string) {
  const current = await db.campaign.findUnique({
    where: { id: discountId },
    select: { id: true, companyId: true },
  });

  if (!current) {
    throw new DemoOperationsStoreError("Silinecek kampanya bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);
  await db.campaign.delete({ where: { id: discountId } });
}

export async function createDemoCoupon(
  input: Omit<DemoCoupon, "id" | "createdAt" | "usageCount" | "companyId"> & {
    companyId?: string;
  },
) {
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

  const companyId = input.companyId ?? (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());

  if (!companyId) {
    throw new DemoOperationsStoreError("Kupon icin firma scope belirlenemedi.");
  }

  await assertPanelCompanyAccess(companyId);

  const websiteId = await getPrimaryWebsiteIdForCompany(companyId);

  const existing = await db.coupon.findFirst({
    where: { companyId, code },
    select: { id: true },
  });

  if (existing) {
    throw new DemoOperationsStoreError("Bu kupon kodu zaten kayitli.");
  }

  const created = await db.coupon.create({
    data: {
      companyId,
      websiteId,
      code,
      title: input.title.trim(),
      description: "",
      status: input.active ? "ACTIVE" : "PAUSED",
      discountMethod: "PERCENTAGE",
      discountValue: input.percentOff,
      startsAt: new Date(`${input.startDate}T00:00:00.000Z`),
      endsAt: new Date(`${input.endDate}T23:59:59.999Z`),
      usageLimit: input.usageLimit,
      usedCount: 0,
      minimumStayNights: 1,
      minimumOrderAmount: 0,
      isPublic: true,
      villas:
        input.villaScope === "ALL"
          ? undefined
          : {
              create: {
                villa: {
                  connect: {
                    companyId_slug: {
                      companyId,
                      slug: input.villaScope,
                    },
                  },
                },
              },
            },
    },
    include: {
      villas: {
        include: { villa: { select: { slug: true } } },
      },
    },
  });

  return {
    id: created.id,
    companyId: created.companyId,
    title: created.title,
    code: created.code,
    villaScope: created.villas[0]?.villa.slug ?? "ALL",
    percentOff: decimalToNumber(created.discountValue),
    startDate: dateKey(created.startsAt),
    endDate: dateKey(created.endsAt),
    usageLimit: created.usageLimit ?? 9999,
    usageCount: created.usedCount,
    active: mapCouponStatusToActive(created.status),
    createdAt: created.createdAt.toISOString(),
  } satisfies DemoCoupon;
}

export async function updateDemoCoupon(couponId: string, input: Partial<Pick<DemoCoupon, "active">>) {
  const current = await db.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, companyId: true },
  });

  if (!current) {
    throw new DemoOperationsStoreError("Kupon bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  await db.coupon.update({
    where: { id: couponId },
    data: {
      status: input.active ? "ACTIVE" : "PAUSED",
    },
  });

  const coupons = await getDemoCoupons({ companyId: current.companyId });
  const updated = coupons.find((coupon) => coupon.id === couponId);

  if (!updated) {
    throw new DemoOperationsStoreError("Guncel kupon okunamadi.");
  }

  return updated;
}

export async function deleteDemoCoupon(couponId: string) {
  const current = await db.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, companyId: true },
  });

  if (!current) {
    throw new DemoOperationsStoreError("Silinecek kupon bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);
  await db.coupon.delete({ where: { id: couponId } });
}

export async function validateDemoCoupon(input: {
  code: string;
  villa: CatalogVilla;
  checkIn: string;
  checkOut: string;
}) {
  const [pricingRecords, discounts, coupons] = await Promise.all([
    getDemoPricingRecords({ companyId: input.villa.companyId }),
    getDemoDiscountCampaigns({ companyId: input.villa.companyId }),
    getDemoCoupons({ companyId: input.villa.companyId }),
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
  const [pricingRecords, discounts, coupons, websiteId] = await Promise.all([
    getDemoPricingRecords({ companyId: input.villa.companyId }),
    getDemoDiscountCampaigns({ companyId: input.villa.companyId }),
    getDemoCoupons({ companyId: input.villa.companyId }),
    getPrimaryWebsiteIdForCompany(input.villa.companyId),
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

  const createdId = `request-${randomUUID().slice(0, 8)}`;

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.create({
      data: {
        id: createdId,
        companyId: input.villa.companyId,
        websiteId,
        villaId: input.villa.id,
        status: "NEW",
        source: mapDemoOriginToSource(input.origin),
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        guestCount: input.guestCount,
        checkIn: new Date(`${input.checkIn}T15:00:00.000Z`),
        checkOut: new Date(`${input.checkOut}T10:00:00.000Z`),
        message: input.message.trim(),
        couponCodeText: resolved.coupon?.code ?? null,
        quotedBaseAmount: resolved.pricing.subtotal,
        quotedDiscountAmount:
          resolved.pricing.activeDiscountTotal + resolved.pricing.couponDiscountTotal,
        quotedCleaningFee: resolved.pricing.cleaningFee,
        quotedTotalAmount: resolved.pricing.grandTotal,
      },
    });

    if (resolved.coupon) {
      await tx.coupon.update({
        where: { id: resolved.coupon.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      await tx.couponRedemption.create({
        data: {
          id: `redemption-${randomUUID().slice(0, 8)}`,
          couponId: resolved.coupon.id,
          bookingRequestId: createdId,
          discountAmount: resolved.pricing.couponDiscountTotal,
        },
      });
    }
  });

  const created = await getDemoRequestById(createdId);

  if (!created) {
    throw new DemoOperationsStoreError("Talep olusturuldu ancak geri okunamadi.");
  }

  return created;
}

export async function updateDemoRequestStatus(requestId: string, status: RequestStatus) {
  const current = await db.bookingRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      companyId: true,
      status: true,
      source: true,
      fullName: true,
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!current) {
    throw new DemoOperationsStoreError("Guncellenecek talep bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const nextStatus = mapDemoStatusToBooking(status);

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
      },
    });

    await tx.bookingRequestStatusHistory.create({
      data: {
        id: `history-${randomUUID().slice(0, 8)}`,
        bookingRequestId: requestId,
        oldStatus: current.status,
        newStatus: nextStatus,
        note: `${current.fullName} kaydi ${getRequestStatusLabel(status)} durumuna alindi.`,
      },
    });
  });

  const updated = await getDemoRequestById(requestId);

  if (!updated) {
    throw new DemoOperationsStoreError("Talep durumu guncellendi ancak geri okunamadi.");
  }

  return updated;
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
        detail: `${approvedRequests.length} kazanilan rezervasyon`,
      },
      {
        label: "Kupon kullanimi",
        value: String(totalCouponUsage),
        detail: `${input.coupons.length} aktif kupon`,
      },
    ],
    topPerformers: {
      topViewedVilla,
      topRequestedVilla,
      topRevenueVilla,
    },
    topMetrics: {
      topViewedVilla,
      topRequestedVilla,
      topRevenueVilla,
      activeDiscountCount: input.discounts.filter((campaign) => campaign.active).length,
    },
    requestDistribution,
    discountCount: input.discounts.filter((campaign) => campaign.active).length,
    revenueByVilla,
    monthlyTrend,
  };
}
