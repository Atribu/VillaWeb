import "server-only";

import type {
  BookingRequestStatus,
  CampaignStatus,
  CalendarSourceStatus,
  CompanyMembership,
  CouponStatus,
  ExternalServiceStatus,
  MembershipRole,
  MembershipStatus,
  MessageStatus,
  OperationTaskStatus,
  RequestSource,
  ResourceDefinitionStatus,
  ReviewStatus,
  SeoContentStatus,
  ShortcutStatus,
  SyncMode,
  SyncOutcome,
  WebsiteStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

export function decimalToNumber(value?: { toNumber(): number } | number | null) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

export function dateKey(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function iso(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  return (value instanceof Date ? value : new Date(value)).toISOString();
}

export function mapBookingStatusToDemo(status: BookingRequestStatus) {
  switch (status) {
    case "CONTACTED":
    case "CONTACT_PENDING":
      return "CONTACTED" as const;
    case "OFFER_SENT":
      return "QUOTE_SENT" as const;
    case "APPROVED":
      return "APPROVED" as const;
    case "CANCELLED":
      return "CANCELLED" as const;
    default:
      return "NEW" as const;
  }
}

export function mapDemoStatusToBooking(status: string): BookingRequestStatus {
  switch (status) {
    case "CONTACTED":
      return "CONTACTED";
    case "QUOTE_SENT":
      return "OFFER_SENT";
    case "APPROVED":
      return "APPROVED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "NEW";
  }
}

export function mapRequestSourceToDemo(source: RequestSource) {
  return source === "PANEL" ? ("MANUAL_PANEL" as const) : ("PUBLIC_FORM" as const);
}

export function mapDemoOriginToSource(origin?: string): RequestSource {
  return origin === "MANUAL_PANEL" ? "PANEL" : "WEB";
}

export function mapOperationStatusToDemo(status: OperationTaskStatus) {
  return status;
}

export function mapDemoOperationStatusToPrisma(status: string): OperationTaskStatus {
  switch (status) {
    case "READY":
      return "READY";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "DONE":
      return "DONE";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export function mapMembershipRoleToDemoRole(role: MembershipRole) {
  switch (role) {
    case "COMPANY_ADMIN":
      return "ADMIN" as const;
    case "SALES":
      return "SALES" as const;
    case "OPERATIONS":
      return "OPERATIONS" as const;
    case "FINANCE":
      return "FINANCE" as const;
    case "CRM":
      return "CRM" as const;
    default:
      return "CONTENT" as const;
  }
}

export function mapDemoRoleToMembershipRole(roleId: string): MembershipRole {
  switch (roleId) {
    case "ADMIN":
      return "COMPANY_ADMIN";
    case "SALES":
      return "SALES";
    case "OPERATIONS":
      return "OPERATIONS";
    case "FINANCE":
      return "FINANCE";
    case "CRM":
      return "CRM";
    default:
      return "CONTENT";
  }
}

export function mapMembershipStatusToDemoStatus(status: MembershipStatus) {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE" as const;
    case "INVITED":
      return "INVITED" as const;
    default:
      return "PASSIVE" as const;
  }
}

export function mapDemoUserStatusToMembershipStatus(status: string): MembershipStatus {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "INVITED":
      return "INVITED";
    default:
      return "SUSPENDED";
  }
}

export function mapWebsiteStatusToDemo(status: WebsiteStatus) {
  return status;
}

export function mapDemoWebsiteStatusToPrisma(status: string): WebsiteStatus {
  switch (status) {
    case "LIVE":
      return "LIVE";
    case "PAUSED":
      return "PAUSED";
    default:
      return "STAGING";
  }
}

export function mapCampaignStatusToActive(status: CampaignStatus) {
  return status === "ACTIVE";
}

export function mapCouponStatusToActive(status: CouponStatus) {
  return status === "ACTIVE";
}

export function mapReviewStatusToDemo(status: ReviewStatus) {
  switch (status) {
    case "PUBLISHED":
      return "PUBLISHED" as const;
    case "HIDDEN":
      return "HIDDEN" as const;
    default:
      return "PENDING" as const;
  }
}

export function mapDemoReviewStatusToPrisma(status: string): ReviewStatus {
  switch (status) {
    case "PUBLISHED":
      return "PUBLISHED";
    case "HIDDEN":
      return "HIDDEN";
    default:
      return "PENDING";
  }
}

export function mapDefinitionStatusToDemo(status: ResourceDefinitionStatus) {
  return status;
}

export function mapDemoDefinitionStatusToPrisma(status: string): ResourceDefinitionStatus {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "PASSIVE":
      return "PASSIVE";
    default:
      return "DRAFT";
  }
}

export function mapMessageStatusToDemo(status: MessageStatus) {
  return status;
}

export function mapShortcutStatusToDemo(status: ShortcutStatus) {
  return status;
}

export function mapDemoShortcutStatusToPrisma(status: string): ShortcutStatus {
  return status === "HIDDEN" ? "HIDDEN" : "ACTIVE";
}

export function mapExternalServiceStatusToDemo(status: ExternalServiceStatus) {
  return status;
}

export function mapDemoExternalServiceStatusToPrisma(status: string): ExternalServiceStatus {
  switch (status) {
    case "WARNING":
      return "WARNING";
    case "OFFLINE":
      return "OFFLINE";
    default:
      return "ACTIVE";
  }
}

export function mapCalendarSourceStatusToDemo(status: CalendarSourceStatus) {
  switch (status) {
    case "ERROR":
      return "ERROR" as const;
    case "WARNING":
      return "WARNING" as const;
    default:
      return "HEALTHY" as const;
  }
}

export function mapDemoCalendarSourceStatusToPrisma(status: string): CalendarSourceStatus {
  switch (status) {
    case "ERROR":
      return "ERROR";
    case "WARNING":
      return "WARNING";
    default:
      return "HEALTHY";
  }
}

export function mapSyncModeToDemo(mode: SyncMode) {
  return mode;
}

export function mapDemoSyncModeToPrisma(mode: string): SyncMode {
  return mode === "TWO_WAY" ? "TWO_WAY" : "IMPORT_ONLY";
}

export function mapSyncOutcomeToDemo(outcome: SyncOutcome) {
  return outcome;
}

export function mapSeoStatusToDemo(status: SeoContentStatus) {
  return status;
}

export async function getPrimaryWebsiteIdForCompany(companyId: string) {
  const website = await db.companyWebsite.findFirst({
    where: { companyId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  return website?.id ?? null;
}

export async function getDefaultCompanyId() {
  const company = await db.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return company?.id ?? null;
}

export function ensureMembershipCompany(
  membership: Pick<CompanyMembership, "companyId"> | null | undefined,
  fallbackCompanyId?: string | null,
) {
  return membership?.companyId ?? fallbackCompanyId ?? null;
}
