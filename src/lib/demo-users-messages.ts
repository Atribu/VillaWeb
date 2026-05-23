import { formatCurrency } from "@/lib/villa-catalog";

export type DemoAgencyStatus = "ACTIVE" | "PAUSED";
export type DemoBranchStatus = "ACTIVE" | "PAUSED";
export type DemoTeamUserStatus = "ACTIVE" | "INVITED" | "PASSIVE";
export type DemoMessageStatus = "NEW" | "READ" | "RESOLVED" | "ARCHIVED";
export type DemoRoleId =
  | "ADMIN"
  | "SALES"
  | "OPERATIONS"
  | "FINANCE"
  | "CRM"
  | "CONTENT";

export type DemoAgencyRecord = {
  id: string;
  name: string;
  kind: "DIRECT_WEB" | "PARTNER" | "INTERNAL";
  ownerName: string;
  city: string;
  status: DemoAgencyStatus;
  requestCount: number;
  approvedRevenue: number;
  openPipeline: number;
  note: string;
};

export type DemoBranchRecord = {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  city: string;
  phone: string;
  status: DemoBranchStatus;
  userCount: number;
  requestCount: number;
  approvedRevenue: number;
};

export type DemoTeamUserRecord = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  agencyId: string;
  agencyName: string;
  branchId: string;
  branchName: string;
  responsibility: string;
  lastActiveAt: string;
};

export type DemoRoleRecord = {
  id: DemoRoleId;
  label: string;
  description: string;
  permissionGroups: string[];
  userCount: number;
};

export type DemoInternalMessageRecord = {
  id: string;
  senderName: string;
  recipientLabel: string;
  subject: string;
  body: string;
  status: DemoMessageStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  relatedModule: string;
  createdAt: string;
};

export type DemoCommissionRateRecord = {
  id: string;
  scopeType: "AGENCY" | "BRANCH" | "STAFF" | "WEB_DIRECT";
  scopeLabel: string;
  percent: number;
  payoutRule: string;
  active: boolean;
  updatedAt: string;
};

export type DemoUsersMessagesOverview = {
  summaryCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  alerts: Array<{
    title: string;
    detail: string;
    tone: "success" | "warning" | "neutral";
  }>;
};

export const seedDemoAgencies: DemoAgencyRecord[] = [
  {
    id: "agency-direct-web",
    name: "Direkt Web",
    kind: "DIRECT_WEB",
    ownerName: "Pazarlama Ekibi",
    city: "Istanbul",
    status: "ACTIVE",
    requestCount: 0,
    approvedRevenue: 0,
    openPipeline: 0,
    note: "SEO ve organik kanallar uzerinden gelen dogrudan rezervasyon akislarini toplar.",
  },
  {
    id: "agency-merkez-rezervasyon",
    name: "Merkez Rezervasyon",
    kind: "INTERNAL",
    ownerName: "Satis Masasi",
    city: "Antalya",
    status: "ACTIVE",
    requestCount: 0,
    approvedRevenue: 0,
    openPipeline: 0,
    note: "Telefon, WhatsApp ve panelden acilan manuel rezervasyonlar bu ekipten geciyor.",
  },
  {
    id: "agency-holiday-partners",
    name: "Holiday Partners",
    kind: "PARTNER",
    ownerName: "Nazli Inan",
    city: "Bodrum",
    status: "PAUSED",
    requestCount: 6,
    approvedRevenue: 184000,
    openPipeline: 2,
    note: "Partner acenta tarafinda komisyon bazli calisan distribusyon kanali.",
  },
];

export const seedDemoBranches: DemoBranchRecord[] = [
  {
    id: "branch-digital-desk",
    agencyId: "agency-direct-web",
    agencyName: "Direkt Web",
    name: "Dijital Satis Masasi",
    city: "Istanbul",
    phone: "+90 212 401 10 10",
    status: "ACTIVE",
    userCount: 2,
    requestCount: 0,
    approvedRevenue: 0,
  },
  {
    id: "branch-central-desk",
    agencyId: "agency-merkez-rezervasyon",
    agencyName: "Merkez Rezervasyon",
    name: "Merkez Operasyon",
    city: "Antalya",
    phone: "+90 242 520 20 20",
    status: "ACTIVE",
    userCount: 2,
    requestCount: 0,
    approvedRevenue: 0,
  },
  {
    id: "branch-bodrum-partner",
    agencyId: "agency-holiday-partners",
    agencyName: "Holiday Partners",
    name: "Bodrum Subesi",
    city: "Bodrum",
    phone: "+90 252 330 44 44",
    status: "PAUSED",
    userCount: 1,
    requestCount: 6,
    approvedRevenue: 184000,
  },
];

export const seedDemoTeamUsers: DemoTeamUserRecord[] = [
  {
    id: "team-admin-1",
    fullName: "Sistem Admini",
    username: "admin",
    email: "admin@villaview.local",
    phone: "+90 532 000 00 01",
    roleId: "ADMIN",
    status: "ACTIVE",
    agencyId: "agency-merkez-rezervasyon",
    agencyName: "Merkez Rezervasyon",
    branchId: "branch-central-desk",
    branchName: "Merkez Operasyon",
    responsibility: "Tum panel, fiyat ve operasyon akislarinin genel yonetimi",
    lastActiveAt: "2026-05-18T09:20:00.000Z",
  },
  {
    id: "team-staff-1",
    fullName: "Villa Personeli",
    username: "villa-personel",
    email: "personel@villaview.local",
    phone: "+90 532 000 00 02",
    roleId: "CONTENT",
    status: "ACTIVE",
    agencyId: "agency-merkez-rezervasyon",
    agencyName: "Merkez Rezervasyon",
    branchId: "branch-central-desk",
    branchName: "Merkez Operasyon",
    responsibility: "Villa iceriklerini, gorselleri ve uygunluk verisini guncelleme",
    lastActiveAt: "2026-05-18T08:45:00.000Z",
  },
  {
    id: "team-sales-1",
    fullName: "Aylin Erdem",
    username: "aylin.erdem",
    email: "aylin@villaview.local",
    phone: "+90 533 120 11 11",
    roleId: "SALES",
    status: "ACTIVE",
    agencyId: "agency-direct-web",
    agencyName: "Direkt Web",
    branchId: "branch-digital-desk",
    branchName: "Dijital Satis Masasi",
    responsibility: "Public formdan gelen talepleri teklif surecine tasima",
    lastActiveAt: "2026-05-18T09:05:00.000Z",
  },
  {
    id: "team-operations-1",
    fullName: "Burak Yalcin",
    username: "burak.yalcin",
    email: "burak@villaview.local",
    phone: "+90 538 230 22 22",
    roleId: "OPERATIONS",
    status: "ACTIVE",
    agencyId: "agency-merkez-rezervasyon",
    agencyName: "Merkez Rezervasyon",
    branchId: "branch-central-desk",
    branchName: "Merkez Operasyon",
    responsibility: "Temizlik, karsilama ve operasyon gorevlerinin saha takibi",
    lastActiveAt: "2026-05-18T07:40:00.000Z",
  },
  {
    id: "team-finance-1",
    fullName: "Derya Tuncer",
    username: "derya.tuncer",
    email: "derya@villaview.local",
    phone: "+90 539 340 33 33",
    roleId: "FINANCE",
    status: "ACTIVE",
    agencyId: "agency-merkez-rezervasyon",
    agencyName: "Merkez Rezervasyon",
    branchId: "branch-central-desk",
    branchName: "Merkez Operasyon",
    responsibility: "Fatura, tahsilat ve kasa akislarinin gunluk takibi",
    lastActiveAt: "2026-05-18T08:12:00.000Z",
  },
  {
    id: "team-crm-1",
    fullName: "Mina Acar",
    username: "mina.acar",
    email: "mina@villaview.local",
    phone: "+90 541 450 44 44",
    roleId: "CRM",
    status: "INVITED",
    agencyId: "agency-direct-web",
    agencyName: "Direkt Web",
    branchId: "branch-digital-desk",
    branchName: "Dijital Satis Masasi",
    responsibility: "Yorum, musteri segmenti ve kampanya akislarini yonetme",
    lastActiveAt: "2026-05-15T10:30:00.000Z",
  },
];

export const seedDemoInternalMessages: DemoInternalMessageRecord[] = [
  {
    id: "message-001",
    senderName: "Derya Tuncer",
    recipientLabel: "Rezervasyon Ekibi",
    subject: "Villa Verde Cove kalan odemesi icin hatirlatma",
    body: "14 gun vade icin hatirlatma metni hazir. Misafire bugun icinde ikinci bildirim gecilebilir.",
    status: "NEW",
    priority: "HIGH",
    relatedModule: "Muhasebe",
    createdAt: "2026-05-18T08:25:00.000Z",
  },
  {
    id: "message-002",
    senderName: "Burak Yalcin",
    recipientLabel: "Villa Personeli",
    subject: "Palm Serenity temizlik vardiyasi teyidi",
    body: "20 Mayis cikisi sonrasi temizlik ve havuz bakimi birlikte planlandi, gorsel kontrol bekleniyor.",
    status: "READ",
    priority: "MEDIUM",
    relatedModule: "Takip & Operasyon",
    createdAt: "2026-05-17T16:40:00.000Z",
  },
  {
    id: "message-003",
    senderName: "Aylin Erdem",
    recipientLabel: "CRM Ekibi",
    subject: "Yeni yorum akisi icin geri donus",
    body: "Balayi segmentindeki son misafirler icin yorum isteme mesajlari haftalik plana eklendi.",
    status: "RESOLVED",
    priority: "LOW",
    relatedModule: "CRM",
    createdAt: "2026-05-16T11:10:00.000Z",
  },
];

export const seedDemoCommissionRates: DemoCommissionRateRecord[] = [
  {
    id: "commission-web-direct",
    scopeType: "WEB_DIRECT",
    scopeLabel: "Direkt Web SEO Trafiği",
    percent: 4,
    payoutRule: "Net rezervasyon tutari uzerinden pazarlama maliyet payi",
    active: true,
    updatedAt: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "commission-partner-holiday",
    scopeType: "AGENCY",
    scopeLabel: "Holiday Partners",
    percent: 12,
    payoutRule: "Onaylanan rezervasyonlarda partner acenta komisyonu",
    active: true,
    updatedAt: "2026-05-11T09:30:00.000Z",
  },
  {
    id: "commission-central-sales",
    scopeType: "STAFF",
    scopeLabel: "Rezervasyon Uzmani Prim Orani",
    percent: 3,
    payoutRule: "Tekliften onaya donusen manuel kayitlar icin ekip primi",
    active: false,
    updatedAt: "2026-05-12T15:15:00.000Z",
  },
];

const baseRoleMeta: Array<Omit<DemoRoleRecord, "userCount">> = [
  {
    id: "ADMIN",
    label: "Admin",
    description: "Tum panel alanlarini ve kritik aksiyonlari gorebilir.",
    permissionGroups: ["Panel Yonetimi", "Rezervasyon", "Muhasebe", "CRM", "Operasyon"],
  },
  {
    id: "SALES",
    label: "Rezervasyon Uzmani",
    description: "Talep ve teklif akislarina odaklanir.",
    permissionGroups: ["Talepler", "Rezervasyonlar", "Musteri Iletisimi"],
  },
  {
    id: "OPERATIONS",
    label: "Operasyon Sorumlusu",
    description: "Sahadaki gorevleri ve cikis-oncesi hazirliklari koordine eder.",
    permissionGroups: ["Takip & Operasyon", "Hatirlaticilar", "Villa Durumlari"],
  },
  {
    id: "FINANCE",
    label: "Muhasebe Uzmani",
    description: "Fatura, kasa ve tahsilat ekranlarini yonetir.",
    permissionGroups: ["Muhasebe", "Tahsilat", "Kasa Takip"],
  },
  {
    id: "CRM",
    label: "CRM Sorumlusu",
    description: "Musteri segmentleri, kampanya ve yorum akislarini izler.",
    permissionGroups: ["CRM", "Yorum Sistemi", "Kuponlar"],
  },
  {
    id: "CONTENT",
    label: "Villa Icerik Personeli",
    description: "Villa ekleme, gorsel ve uygunluk guncellemelerine odaklanir.",
    permissionGroups: ["Villa Listesi", "Yeni Villa", "Uygunluk"],
  },
];

export function buildDemoRoles(users: DemoTeamUserRecord[]) {
  return baseRoleMeta.map((role) => ({
    ...role,
    userCount: users.filter((user) => user.roleId === role.id).length,
  }));
}

export function getAgencyStatusLabel(status: DemoAgencyStatus) {
  return status === "ACTIVE" ? "Aktif" : "Pasif";
}

export function getAgencyStatusTone(status: DemoAgencyStatus) {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export function getBranchStatusLabel(status: DemoBranchStatus) {
  return status === "ACTIVE" ? "Aktif" : "Pasif";
}

export function getBranchStatusTone(status: DemoBranchStatus) {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export function getTeamUserStatusLabel(status: DemoTeamUserStatus) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "INVITED":
      return "Davet Bekliyor";
    case "PASSIVE":
      return "Pasif";
    default:
      return status;
  }
}

export function getTeamUserStatusTone(status: DemoTeamUserStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INVITED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getRoleLabel(roleId: DemoRoleId) {
  return baseRoleMeta.find((role) => role.id === roleId)?.label ?? roleId;
}

export function getMessageStatusLabel(status: DemoMessageStatus) {
  switch (status) {
    case "NEW":
      return "Yeni";
    case "READ":
      return "Okundu";
    case "RESOLVED":
      return "Cozuldu";
    case "ARCHIVED":
      return "Arsiv";
    default:
      return status;
  }
}

export function getMessageStatusTone(status: DemoMessageStatus) {
  switch (status) {
    case "NEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "READ":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getMessagePriorityLabel(priority: DemoInternalMessageRecord["priority"]) {
  switch (priority) {
    case "HIGH":
      return "Yuksek";
    case "MEDIUM":
      return "Orta";
    default:
      return "Dusuk";
  }
}

export function getCommissionScopeLabel(scopeType: DemoCommissionRateRecord["scopeType"]) {
  switch (scopeType) {
    case "AGENCY":
      return "Acenta";
    case "BRANCH":
      return "Sube";
    case "STAFF":
      return "Personel";
    default:
      return "Direkt Web";
  }
}

export function buildUsersMessagesOverview(input: {
  agencies: DemoAgencyRecord[];
  branches: DemoBranchRecord[];
  users: DemoTeamUserRecord[];
  messages: DemoInternalMessageRecord[];
  commissions: DemoCommissionRateRecord[];
}) {
  const activeAgencies = input.agencies.filter((agency) => agency.status === "ACTIVE").length;
  const activeBranches = input.branches.filter((branch) => branch.status === "ACTIVE").length;
  const activeUsers = input.users.filter((user) => user.status === "ACTIVE").length;
  const unreadMessages = input.messages.filter((message) => message.status === "NEW").length;
  const activeCommissions = input.commissions.filter((commission) => commission.active);
  const averageCommission =
    activeCommissions.length > 0
      ? activeCommissions.reduce((sum, item) => sum + item.percent, 0) / activeCommissions.length
      : 0;

  const alerts = [];

  if (unreadMessages > 0) {
    alerts.push({
      title: "Ekip ici mesaj bekliyor",
      detail: `${unreadMessages} adet yeni mesaj durum aksiyonu bekliyor.`,
      tone: "warning" as const,
    });
  }

  const invitedUsers = input.users.filter((user) => user.status === "INVITED").length;
  if (invitedUsers > 0) {
    alerts.push({
      title: "Davet bekleyen kullanicilar var",
      detail: `${invitedUsers} ekip uyesi henuz panel aktivasyonunu tamamlamadi.`,
      tone: "neutral" as const,
    });
  }

  const pausedAgencies = input.agencies.filter((agency) => agency.status === "PAUSED").length;
  if (pausedAgencies > 0) {
    alerts.push({
      title: "Pasif acenta kayitlari mevcut",
      detail: `${pausedAgencies} acenta kaydi yeniden degerlendirme bekliyor.`,
      tone: "success" as const,
    });
  }

  return {
    summaryCards: [
      {
        label: "Aktif acenta",
        value: String(activeAgencies),
        detail: "Rezervasyon kanalinda anlik calisan acenta kaydi.",
      },
      {
        label: "Aktif sube",
        value: String(activeBranches),
        detail: "Ekip dagilimi olan operasyon noktalarinin sayisi.",
      },
      {
        label: "Aktif kullanici",
        value: String(activeUsers),
        detail: "Panelde aktif gorev alan ekip uyesi.",
      },
      {
        label: "Ortalama komisyon",
        value: `%${averageCommission.toFixed(1)}`,
        detail: "Aktif komisyon kurallarinin ortalama oran seviyesi.",
      },
      {
        label: "Yeni mesaj",
        value: String(unreadMessages),
        detail: "Okunmayi bekleyen ic bildirim kayitlari.",
      },
      {
        label: "Canli kanal cirosu",
        value: formatCurrency(
          input.agencies.reduce((sum, agency) => sum + agency.approvedRevenue, 0),
        ),
        detail: "Acenta bazinda takip edilen toplam onayli rezervasyon cirosu.",
      },
    ],
    alerts,
  } satisfies DemoUsersMessagesOverview;
}
