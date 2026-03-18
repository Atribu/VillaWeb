import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency, seedVillaCatalog } from "@/lib/villa-catalog";
import { getNightCount } from "@/lib/villa-availability";

export type RequestStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTE_SENT"
  | "APPROVED"
  | "CANCELLED";

export type DemoPricingRecord = {
  villaSlug: string;
  baseNightlyPrice: number;
  cleaningFee: number;
  minNightCount: number;
  updatedAt: string;
};

export type DemoDiscountCampaign = {
  id: string;
  title: string;
  villaScope: "ALL" | string;
  percentOff: number;
  startDate: string;
  endDate: string;
  note: string;
  active: boolean;
  createdAt: string;
};

export type DemoCoupon = {
  id: string;
  title: string;
  code: string;
  villaScope: "ALL" | string;
  percentOff: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
  createdAt: string;
};

export type RequestPricingBreakdown = {
  nightCount: number;
  baseNightlyPrice: number;
  discountedNightlyPrice: number;
  subtotal: number;
  activeDiscountTotal: number;
  activeDiscountTitle?: string;
  activeDiscountPercent?: number;
  cleaningFee: number;
  couponCode?: string;
  couponTitle?: string;
  couponPercent?: number;
  couponDiscountTotal: number;
  grandTotal: number;
};

export type DemoRequest = {
  id: string;
  villaSlug: string;
  villaTitle: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  fullName: string;
  phone: string;
  email: string;
  message: string;
  couponCode?: string;
  status: RequestStatus;
  createdAt: string;
  pricing: RequestPricingBreakdown;
};

export type ResolvedVillaPricing = {
  baseNightlyPrice: number;
  discountedNightlyPrice?: number;
  cleaningFee: number;
  minNightCount: number;
  activeDiscount: DemoDiscountCampaign | null;
};

export type ResolvedStayPricing = {
  pricing: RequestPricingBreakdown;
  coupon: DemoCoupon | null;
  activeDiscount: DemoDiscountCampaign | null;
};

export const DEMO_REFERENCE_DATE = "2026-03-18";

export const REQUEST_STATUS_OPTIONS: Array<{
  value: RequestStatus;
  label: string;
  description: string;
}> = [
  {
    value: "NEW",
    label: "Yeni Talep",
    description: "Panel ekibinin geri donus yapmasi bekleniyor.",
  },
  {
    value: "CONTACTED",
    label: "Iletisim Kuruldu",
    description: "Misafir ile ilk gorusme yapildi.",
  },
  {
    value: "QUOTE_SENT",
    label: "Teklif Gonderildi",
    description: "Fiyat ve detaylar paylasildi.",
  },
  {
    value: "APPROVED",
    label: "Onaylandi",
    description: "Ticari olarak kazanilan talep.",
  },
  {
    value: "CANCELLED",
    label: "Iptal",
    description: "Talep kapatildi veya vazgecildi.",
  },
];

export const seedDemoPricingRecords: DemoPricingRecord[] = seedVillaCatalog.map((villa) => ({
  villaSlug: villa.slug,
  baseNightlyPrice: villa.nightlyPrice,
  cleaningFee: villa.capacity > 8 ? 4500 : villa.capacity > 4 ? 3000 : 1800,
  minNightCount: villa.capacity > 8 ? 4 : 3,
  updatedAt: DEMO_REFERENCE_DATE,
}));

export const seedDemoDiscountCampaigns: DemoDiscountCampaign[] = [
  {
    id: "discount-soleia-spring",
    title: "Ilkbahar Deniz Manzarasi Kampanyasi",
    villaScope: "kalkan-deniz-manzarali-luks-villa-soleia-lagoon",
    percentOff: 14,
    startDate: "2026-03-01",
    endDate: "2026-04-15",
    note: "Erken sezon doluluk hizlandirma kampanyasi.",
    active: true,
    createdAt: "2026-03-10T10:00:00.000Z",
  },
  {
    id: "discount-palm-family",
    title: "Ailelere Ozel Nisan Avantaji",
    villaScope: "fethiye-ozel-havuzlu-aile-villasi-palm-serenity",
    percentOff: 11,
    startDate: "2026-03-15",
    endDate: "2026-04-20",
    note: "Aile segmentinde talep toplamaya yonelik donemsel indirim.",
    active: true,
    createdAt: "2026-03-12T14:00:00.000Z",
  },
  {
    id: "discount-marea-groups",
    title: "Grup Rezervasyon Yaz Oncesi",
    villaScope: "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand",
    percentOff: 12,
    startDate: "2026-04-01",
    endDate: "2026-05-20",
    note: "Kalabalik grup taleplerini erkenden toplamak icin olusturuldu.",
    active: true,
    createdAt: "2026-03-13T09:30:00.000Z",
  },
];

export const seedDemoCoupons: DemoCoupon[] = [
  {
    id: "coupon-yazbasliyor",
    title: "Yaz Basliyor Kuponu",
    code: "YAZBASLIYOR10",
    villaScope: "ALL",
    percentOff: 10,
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    usageLimit: 25,
    usageCount: 3,
    active: true,
    createdAt: "2026-03-08T08:00:00.000Z",
  },
  {
    id: "coupon-balayi",
    title: "Balayi Ozel Kod",
    code: "BALAYI7",
    villaScope: "kas-balayi-icin-muhafazakar-villa-verde-cove",
    percentOff: 7,
    startDate: "2026-03-10",
    endDate: "2026-06-30",
    usageLimit: 12,
    usageCount: 1,
    active: true,
    createdAt: "2026-03-10T15:00:00.000Z",
  },
];

export const seedDemoRequests: DemoRequest[] = [
  {
    id: "request-001",
    villaSlug: "kalkan-deniz-manzarali-luks-villa-soleia-lagoon",
    villaTitle: "Villa Soleia Lagoon",
    checkIn: "2026-04-22",
    checkOut: "2026-04-27",
    guestCount: 6,
    fullName: "Mert Yildiz",
    phone: "+90 532 100 10 10",
    email: "mert@example.com",
    message: "Havalimanindan transfer ve cocuk yatagi bilgisini de iletmenizi rica ederim.",
    couponCode: "YAZBASLIYOR10",
    status: "QUOTE_SENT",
    createdAt: "2026-03-16T10:20:00.000Z",
    pricing: {
      nightCount: 5,
      baseNightlyPrice: 18500,
      discountedNightlyPrice: 15910,
      subtotal: 92500,
      activeDiscountTotal: 12950,
      activeDiscountTitle: "Ilkbahar Deniz Manzarasi Kampanyasi",
      activeDiscountPercent: 14,
      cleaningFee: 3000,
      couponCode: "YAZBASLIYOR10",
      couponTitle: "Yaz Basliyor Kuponu",
      couponPercent: 10,
      couponDiscountTotal: 7955,
      grandTotal: 74695,
    },
  },
  {
    id: "request-002",
    villaSlug: "fethiye-ozel-havuzlu-aile-villasi-palm-serenity",
    villaTitle: "Villa Palm Serenity",
    checkIn: "2026-04-18",
    checkOut: "2026-04-24",
    guestCount: 8,
    fullName: "Seda Karaca",
    phone: "+90 530 222 22 22",
    email: "seda@example.com",
    message: "Bebek sandalyesi ve erken giris imkani hakkinda bilgi rica ederim.",
    status: "NEW",
    createdAt: "2026-03-17T13:15:00.000Z",
    pricing: {
      nightCount: 6,
      baseNightlyPrice: 14900,
      discountedNightlyPrice: 13261,
      subtotal: 89400,
      activeDiscountTotal: 9834,
      activeDiscountTitle: "Ailelere Ozel Nisan Avantaji",
      activeDiscountPercent: 11,
      cleaningFee: 3000,
      couponDiscountTotal: 0,
      grandTotal: 82566,
    },
  },
  {
    id: "request-003",
    villaSlug: "kas-balayi-icin-muhafazakar-villa-verde-cove",
    villaTitle: "Villa Verde Cove",
    checkIn: "2026-05-10",
    checkOut: "2026-05-14",
    guestCount: 2,
    fullName: "Elif Demir",
    phone: "+90 542 333 33 33",
    email: "elif@example.com",
    message: "Balayi paketi ve oda susleme seceneklerini ogrenmek istiyorum.",
    couponCode: "BALAYI7",
    status: "APPROVED",
    createdAt: "2026-03-15T16:45:00.000Z",
    pricing: {
      nightCount: 4,
      baseNightlyPrice: 17250,
      discountedNightlyPrice: 17250,
      subtotal: 69000,
      activeDiscountTotal: 0,
      cleaningFee: 1800,
      couponCode: "BALAYI7",
      couponTitle: "Balayi Ozel Kod",
      couponPercent: 7,
      couponDiscountTotal: 4830,
      grandTotal: 65970,
    },
  },
];

export function getRequestStatusLabel(status: RequestStatus) {
  return REQUEST_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getRequestStatusTone(status: RequestStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "QUOTE_SENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CONTACTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isVillaScopeMatch(scope: "ALL" | string, villaSlug: string) {
  return scope === "ALL" || scope === villaSlug;
}

export function parseCurrencyLabel(value: string) {
  const numeric = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function getBasePricingRecord(
  villa: CatalogVilla,
  pricingRecords: DemoPricingRecord[],
): DemoPricingRecord {
  return (
    pricingRecords.find((record) => record.villaSlug === villa.slug) ?? {
      villaSlug: villa.slug,
      baseNightlyPrice: villa.nightlyPrice,
      cleaningFee: 0,
      minNightCount: 1,
      updatedAt: DEMO_REFERENCE_DATE,
    }
  );
}

function isDateWithinInclusiveRange(dateKey: string, startDate: string, endDate: string) {
  return dateKey >= startDate && dateKey <= endDate;
}

function isStayWithinCampaign(checkIn: string, checkOut: string, campaign: DemoDiscountCampaign) {
  if (!checkIn || !checkOut) {
    return false;
  }

  return checkIn >= campaign.startDate && checkOut <= campaign.endDate;
}

export function getActiveDiscountForVilla(
  villaSlug: string,
  discounts: DemoDiscountCampaign[],
  input?: {
    checkIn?: string;
    checkOut?: string;
    referenceDate?: string;
  },
) {
  const referenceDate = input?.referenceDate ?? DEMO_REFERENCE_DATE;

  return (
    [...discounts]
      .filter(
        (campaign) =>
          campaign.active &&
          isVillaScopeMatch(campaign.villaScope, villaSlug) &&
          (input?.checkIn && input?.checkOut
            ? isStayWithinCampaign(input.checkIn, input.checkOut, campaign)
            : isDateWithinInclusiveRange(referenceDate, campaign.startDate, campaign.endDate)),
      )
      .sort((left, right) => right.percentOff - left.percentOff)[0] ?? null
  );
}

export function getResolvedVillaPricing(
  villa: CatalogVilla,
  pricingRecords: DemoPricingRecord[],
  discounts: DemoDiscountCampaign[],
) {
  const pricingRecord = getBasePricingRecord(villa, pricingRecords);
  const activeDiscount = getActiveDiscountForVilla(villa.slug, discounts);
  const hasCampaignHistory = discounts.some((campaign) => isVillaScopeMatch(campaign.villaScope, villa.slug));
  const fallbackDiscountedNightlyPrice =
    !hasCampaignHistory &&
    villa.discountedNightlyPrice &&
    villa.discountedNightlyPrice < pricingRecord.baseNightlyPrice
      ? villa.discountedNightlyPrice
      : undefined;
  const campaignNightlyPrice = activeDiscount
    ? Math.round(pricingRecord.baseNightlyPrice * (1 - activeDiscount.percentOff / 100))
    : undefined;

  return {
    baseNightlyPrice: pricingRecord.baseNightlyPrice,
    discountedNightlyPrice: campaignNightlyPrice ?? fallbackDiscountedNightlyPrice,
    cleaningFee: pricingRecord.cleaningFee,
    minNightCount: pricingRecord.minNightCount,
    activeDiscount,
  } satisfies ResolvedVillaPricing;
}

export function getEligibleCoupon(
  coupons: DemoCoupon[],
  input: {
    code: string;
    villaSlug: string;
    checkIn: string;
    checkOut: string;
  },
) {
  const normalizedCode = normalizeCouponCode(input.code);

  if (!normalizedCode) {
    return null;
  }

  return (
    coupons.find(
      (coupon) =>
        coupon.active &&
        coupon.code === normalizedCode &&
        isVillaScopeMatch(coupon.villaScope, input.villaSlug) &&
        coupon.usageCount < coupon.usageLimit &&
        input.checkIn >= coupon.startDate &&
        input.checkOut <= coupon.endDate,
    ) ?? null
  );
}

export function getResolvedStayPricing(input: {
  villa: CatalogVilla;
  pricingRecords: DemoPricingRecord[];
  discounts: DemoDiscountCampaign[];
  coupons: DemoCoupon[];
  checkIn: string;
  checkOut: string;
  couponCode?: string;
}) {
  const nightCount = getNightCount(input.checkIn, input.checkOut);
  const basePricing = getBasePricingRecord(input.villa, input.pricingRecords);
  const activeDiscount = getActiveDiscountForVilla(input.villa.slug, input.discounts, {
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });
  const discountedNightlyPrice = activeDiscount
    ? Math.round(basePricing.baseNightlyPrice * (1 - activeDiscount.percentOff / 100))
    : basePricing.baseNightlyPrice;
  const subtotal = basePricing.baseNightlyPrice * nightCount;
  const discountedSubtotal = discountedNightlyPrice * nightCount;
  const activeDiscountTotal = Math.max(subtotal - discountedSubtotal, 0);
  const coupon = input.couponCode
    ? getEligibleCoupon(input.coupons, {
        code: input.couponCode,
        villaSlug: input.villa.slug,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
      })
    : null;
  const couponDiscountTotal = coupon
    ? Math.round(discountedSubtotal * (coupon.percentOff / 100))
    : 0;
  const grandTotal = discountedSubtotal - couponDiscountTotal + basePricing.cleaningFee;

  return {
    pricing: {
      nightCount,
      baseNightlyPrice: basePricing.baseNightlyPrice,
      discountedNightlyPrice,
      subtotal,
      activeDiscountTotal,
      activeDiscountTitle: activeDiscount?.title,
      activeDiscountPercent: activeDiscount?.percentOff,
      cleaningFee: basePricing.cleaningFee,
      couponCode: coupon?.code,
      couponTitle: coupon?.title,
      couponPercent: coupon?.percentOff,
      couponDiscountTotal,
      grandTotal,
    },
    coupon,
    activeDiscount,
  } satisfies ResolvedStayPricing;
}

export function getMinimumNightCount(villa: CatalogVilla, pricingRecords: DemoPricingRecord[]) {
  return getBasePricingRecord(villa, pricingRecords).minNightCount;
}

export function formatPercent(percent: number) {
  return `%${percent}`;
}

export function formatRequestPriceSummary(pricing: RequestPricingBreakdown) {
  return {
    subtotalLabel: formatCurrency(pricing.subtotal),
    activeDiscountLabel: formatCurrency(pricing.activeDiscountTotal),
    cleaningFeeLabel: formatCurrency(pricing.cleaningFee),
    couponDiscountLabel: formatCurrency(pricing.couponDiscountTotal),
    grandTotalLabel: formatCurrency(pricing.grandTotal),
  };
}
