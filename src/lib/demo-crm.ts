import type { DemoCoupon, DemoDiscountCampaign, DemoRequest } from "@/lib/demo-operations";

export type DemoCustomerSegment = "LEAD" | "ACTIVE" | "RETURNING" | "VIP";

export type DemoCustomerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  segment: DemoCustomerSegment;
  totalRequests: number;
  approvedReservations: number;
  quoteCount: number;
  cancelledCount: number;
  totalRevenue: number;
  pipelineValue: number;
  lastRequestAt: string;
  preferredVillaTitle: string;
  origin: "PUBLIC_FORM" | "MANUAL_PANEL";
  notes: string[];
};

export type DemoReviewStatus = "PUBLISHED" | "PENDING" | "HIDDEN";

export type DemoReviewSource = "GOOGLE" | "DIRECT" | "WHATSAPP";

export type DemoReviewRecord = {
  id: string;
  villaSlug: string;
  villaTitle: string;
  guestName: string;
  rating: number;
  comment: string;
  source: DemoReviewSource;
  status: DemoReviewStatus;
  createdAt: string;
  staffNote?: string;
};

export const seedDemoReviews: DemoReviewRecord[] = [
  {
    id: "review-soleia-01",
    villaSlug: "kalkan-deniz-manzarali-luks-villa-soleia-lagoon",
    villaTitle: "Villa Soleia Lagoon",
    guestName: "Merve A.",
    rating: 5,
    comment:
      "Manzara ve havuz alanı çok güçlüydü. Giriş süreci çok hızlı ilerledi, tekrar tercih ederiz.",
    source: "GOOGLE",
    status: "PUBLISHED",
    createdAt: "2026-03-14T11:20:00.000Z",
  },
  {
    id: "review-palm-01",
    villaSlug: "fethiye-ozel-havuzlu-aile-villasi-palm-serenity",
    villaTitle: "Villa Palm Serenity",
    guestName: "Banu K.",
    rating: 4,
    comment:
      "Aile konaklaması için gayet rahattı. Bahçe ve çocuk havuzu çok işimize yaradı.",
    source: "DIRECT",
    status: "PUBLISHED",
    createdAt: "2026-03-16T09:15:00.000Z",
  },
  {
    id: "review-verde-01",
    villaSlug: "kas-balayi-icin-muhafazakar-villa-verde-cove",
    villaTitle: "Villa Verde Cove",
    guestName: "Elif D.",
    rating: 5,
    comment:
      "Balayı için sakin ve çok keyifliydi. Yorum yayına alınmadan önce bir iki fotoğraf da eklemek istiyoruz.",
    source: "WHATSAPP",
    status: "PENDING",
    createdAt: "2026-03-18T14:40:00.000Z",
    staffNote: "Fotoğraf eklenirse vitrine öne çıkarılabilir.",
  },
  {
    id: "review-marea-01",
    villaSlug: "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand",
    villaTitle: "Villa Marea Grand",
    guestName: "Can Y.",
    rating: 3,
    comment:
      "Kalabalık grup için alan iyiydi ama giriş saatiyle ilgili yaşadığımız karışıklık nedeniyle tekrar kontrol istiyoruz.",
    source: "DIRECT",
    status: "HIDDEN",
    createdAt: "2026-03-12T16:05:00.000Z",
    staffNote: "Misafirle yeniden görüşülüyor, görünür değil.",
  },
];

function normalizeCustomerKey(request: DemoRequest) {
  return request.email.trim().toLowerCase() || request.phone.trim();
}

function getPreferredVillaTitle(requests: DemoRequest[]) {
  const counter = new Map<string, number>();

  for (const request of requests) {
    counter.set(request.villaTitle, (counter.get(request.villaTitle) ?? 0) + 1);
  }

  return [...counter.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-";
}

function getCustomerSegment(input: {
  approvedReservations: number;
  totalRequests: number;
  totalRevenue: number;
  quoteCount: number;
}) {
  if (input.approvedReservations >= 2 || input.totalRevenue >= 150000) {
    return "VIP" satisfies DemoCustomerSegment;
  }

  if (input.approvedReservations >= 1) {
    return "RETURNING" satisfies DemoCustomerSegment;
  }

  if (input.totalRequests >= 2 || input.quoteCount >= 1) {
    return "ACTIVE" satisfies DemoCustomerSegment;
  }

  return "LEAD" satisfies DemoCustomerSegment;
}

export function buildDemoCustomers(requests: DemoRequest[]) {
  const grouped = new Map<string, DemoRequest[]>();

  for (const request of requests) {
    const key = normalizeCustomerKey(request);
    const bucket = grouped.get(key) ?? [];
    bucket.push(request);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, customerRequests]) => {
      const sortedRequests = [...customerRequests].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
      const latest = sortedRequests[0];
      const approvedReservations = customerRequests.filter(
        (request) => request.status === "APPROVED",
      ).length;
      const quoteCount = customerRequests.filter((request) => request.status === "QUOTE_SENT").length;
      const cancelledCount = customerRequests.filter(
        (request) => request.status === "CANCELLED",
      ).length;
      const totalRevenue = customerRequests
        .filter((request) => request.status === "APPROVED")
        .reduce((sum, request) => sum + request.pricing.grandTotal, 0);
      const pipelineValue = customerRequests
        .filter((request) => request.status !== "CANCELLED")
        .reduce((sum, request) => sum + request.pricing.grandTotal, 0);
      const segment = getCustomerSegment({
        approvedReservations,
        totalRequests: customerRequests.length,
        totalRevenue,
        quoteCount,
      });

      const notes = [
        approvedReservations > 0
          ? `${approvedReservations} onayli rezervasyon gecmisi var`
          : "Henuz onayli rezervasyon yok",
        quoteCount > 0 ? `${quoteCount} kayit teklif surecinden gecmis` : "Teklif sureci kaydi bulunmuyor",
      ];

      return {
        id: `customer-${key.replace(/[^a-z0-9]/gi, "-")}`,
        fullName: latest.fullName,
        email: latest.email,
        phone: latest.phone,
        segment,
        totalRequests: customerRequests.length,
        approvedReservations,
        quoteCount,
        cancelledCount,
        totalRevenue,
        pipelineValue,
        lastRequestAt: latest.createdAt,
        preferredVillaTitle: getPreferredVillaTitle(customerRequests),
        origin: latest.origin ?? "PUBLIC_FORM",
        notes,
      } satisfies DemoCustomerRecord;
    })
    .sort((left, right) => {
      if (right.totalRevenue !== left.totalRevenue) {
        return right.totalRevenue - left.totalRevenue;
      }

      return right.lastRequestAt.localeCompare(left.lastRequestAt);
    });
}

export function getCustomerSegmentLabel(segment: DemoCustomerSegment) {
  switch (segment) {
    case "VIP":
      return "VIP";
    case "RETURNING":
      return "Tekrar Gelen";
    case "ACTIVE":
      return "Aktif Aday";
    default:
      return "Lead";
  }
}

export function getCustomerSegmentTone(segment: DemoCustomerSegment) {
  switch (segment) {
    case "VIP":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RETURNING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ACTIVE":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getReviewStatusLabel(status: DemoReviewStatus) {
  switch (status) {
    case "PUBLISHED":
      return "Yayinda";
    case "HIDDEN":
      return "Gizli";
    default:
      return "Beklemede";
  }
}

export function getReviewStatusTone(status: DemoReviewStatus) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "HIDDEN":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getReviewSourceLabel(source: DemoReviewSource) {
  switch (source) {
    case "GOOGLE":
      return "Google";
    case "WHATSAPP":
      return "WhatsApp";
    default:
      return "Direkt";
  }
}

export function buildCrmOverview(input: {
  requests: DemoRequest[];
  coupons: DemoCoupon[];
  discounts: DemoDiscountCampaign[];
  reviews: DemoReviewRecord[];
}) {
  const customers = buildDemoCustomers(input.requests);
  const activeCoupons = input.coupons.filter((coupon) => coupon.active).length;
  const activeDiscounts = input.discounts.filter((discount) => discount.active).length;
  const publishedReviews = input.reviews.filter((review) => review.status === "PUBLISHED").length;
  const pendingReviews = input.reviews.filter((review) => review.status === "PENDING").length;
  const vipCustomers = customers.filter((customer) => customer.segment === "VIP").length;
  const publicLeads = input.requests.filter((request) => (request.origin ?? "PUBLIC_FORM") === "PUBLIC_FORM").length;
  const panelLeads = input.requests.length - publicLeads;

  return {
    customers,
    summaryCards: [
      {
        label: "Toplam musteri",
        value: String(customers.length),
        detail: `${vipCustomers} VIP segmentte`,
      },
      {
        label: "Aktif kupon",
        value: String(activeCoupons),
        detail: `${activeDiscounts} aktif kampanya ile birlikte calisiyor`,
      },
      {
        label: "Yorum akisi",
        value: `${publishedReviews} / ${pendingReviews}`,
        detail: "yayinda / onay bekleyen",
      },
      {
        label: "Kaynak dagilimi",
        value: `${publicLeads} / ${panelLeads}`,
        detail: "public form / panel kaydi",
      },
    ],
    segmentDistribution: {
      LEAD: customers.filter((customer) => customer.segment === "LEAD").length,
      ACTIVE: customers.filter((customer) => customer.segment === "ACTIVE").length,
      RETURNING: customers.filter((customer) => customer.segment === "RETURNING").length,
      VIP: customers.filter((customer) => customer.segment === "VIP").length,
    },
  };
}
