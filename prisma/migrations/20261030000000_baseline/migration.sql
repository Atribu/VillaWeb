-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'COMPANY_USER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('COMPANY_ADMIN', 'SALES', 'OPERATIONS', 'FINANCE', 'CRM', 'CONTENT', 'VILLA_MANAGER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('LIVE', 'STAGING', 'PAUSED');

-- CreateEnum
CREATE TYPE "VillaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AvailabilityBlockType" AS ENUM ('RESERVED', 'MAINTENANCE', 'UNAVAILABLE', 'OWNER_STAY');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('BASE', 'SEASONAL', 'WEEKEND', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "DiscountMethod" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('NEW', 'CONTACT_PENDING', 'CONTACTED', 'OFFER_SENT', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('WEB', 'PANEL', 'PHONE', 'AGENCY');

-- CreateEnum
CREATE TYPE "OperationTaskType" AS ENUM ('RESERVATION_TRACK', 'SUPPLIER_APPROVAL', 'REMINDER', 'CHECK_IN', 'CHECK_OUT', 'CLEANING');

-- CreateEnum
CREATE TYPE "OperationTaskStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'BALANCE', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CashEntrySource" AS ENUM ('AUTO_PAYMENT', 'MANUAL', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'PENDING', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GOOGLE', 'DIRECT', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CalendarDirection" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "CalendarSourceStatus" AS ENUM ('HEALTHY', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncMode" AS ENUM ('IMPORT_ONLY', 'TWO_WAY');

-- CreateEnum
CREATE TYPE "SyncOutcome" AS ENUM ('SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "AgencyKind" AS ENUM ('DIRECT_WEB', 'PARTNER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('NEW', 'READ', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CommissionScopeType" AS ENUM ('AGENCY', 'BRANCH', 'USER', 'WEB_DIRECT');

-- CreateEnum
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'LIVE', 'REVISION');

-- CreateEnum
CREATE TYPE "ResourceDefinitionStatus" AS ENUM ('ACTIVE', 'DRAFT', 'PASSIVE');

-- CreateEnum
CREATE TYPE "CurrencyRateStatus" AS ENUM ('LIVE', 'MANUAL', 'STALE');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "CacheGroupStatus" AS ENUM ('HEALTHY', 'WARMING', 'STALE');

-- CreateEnum
CREATE TYPE "DocumentAssetStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShortcutStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ExternalServiceStatus" AS ENUM ('ACTIVE', 'WARNING', 'OFFLINE');

-- CreateEnum
CREATE TYPE "SeoContentType" AS ENUM ('BLOG', 'LANDING', 'CATEGORY', 'PAGE');

-- CreateEnum
CREATE TYPE "SeoContentStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "defaultLocale" TEXT NOT NULL DEFAULT 'tr-TR',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "shortName" TEXT,
    "panelName" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "whatsappNumber" TEXT,
    "supportHours" TEXT,
    "primaryDomain" TEXT,
    "taxNumber" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "locale" TEXT NOT NULL DEFAULT 'tr-TR',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'COMPANY_USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMembership" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "responsibility" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "defaultTitle" TEXT,
    "defaultDescription" TEXT,
    "primaryPhone" TEXT,
    "primaryEmail" TEXT,
    "address" TEXT,
    "whatsappNumber" TEXT,
    "accentLabel" TEXT,
    "heroTitle" TEXT,
    "heroDescription" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "seoIndexable" BOOLEAN NOT NULL DEFAULT true,
    "allowCoupons" BOOLEAN NOT NULL DEFAULT true,
    "allowManualQuotes" BOOLEAN NOT NULL DEFAULT true,
    "leadResponseMinutes" INTEGER NOT NULL DEFAULT 20,
    "defaultMinNightCount" INTEGER NOT NULL DEFAULT 3,
    "defaultCleaningLeadHours" INTEGER NOT NULL DEFAULT 6,
    "requestReminderHours" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyWebsite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'tr-TR',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'STAGING',
    "primaryChannel" TEXT,
    "brandHeadline" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "themeKey" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "analyticsKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "districtScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ResourceDefinitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "countryCode" TEXT NOT NULL DEFAULT 'TR',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" TEXT NOT NULL,
    "regionId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "driveMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Villa" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "regionId" TEXT,
    "createdByUserId" TEXT,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "shortCode" TEXT,
    "slug" TEXT NOT NULL,
    "badge" TEXT,
    "badgeEn" TEXT,
    "category" TEXT,
    "categoryEn" TEXT,
    "shortDescription" TEXT,
    "shortDescriptionEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "ownerVillaName" TEXT,
    "supplierName" TEXT,
    "supplierPhone" TEXT,
    "supplierEmail" TEXT,
    "supplierNotes" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "marketDistanceMeters" INTEGER,
    "beachDistanceMeters" INTEGER,
    "centerDistanceMeters" INTEGER,
    "airportDistanceKm" DOUBLE PRECISION,
    "capacity" INTEGER NOT NULL,
    "bedroomCount" INTEGER NOT NULL,
    "bathroomCount" INTEGER NOT NULL,
    "poolType" TEXT,
    "poolTypeEn" TEXT,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "suitabilityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "houseRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "houseRulesEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nightlyBasePrice" DECIMAL(12,2) NOT NULL,
    "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "electricityFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "waterFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "extraGuestFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "damageDeposit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "extraFeeNotes" TEXT,
    "extraFeeNotesEn" TEXT,
    "minNightCount" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "VillaStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "averageRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isSuperhost" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "coverAlt" TEXT,
    "coverAltEn" TEXT,
    "seoTitle" TEXT,
    "seoTitleEn" TEXT,
    "seoDescription" TEXT,
    "seoDescriptionEn" TEXT,
    "focusKeyword" TEXT,
    "focusKeywordEn" TEXT,
    "tourismLicenseNumber" TEXT,
    "tourismLicensePdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Villa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaImage" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaAmenity" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "VillaAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "blockType" "AvailabilityBlockType" NOT NULL,
    "note" TEXT,
    "sourceRequestId" TEXT,
    "calendarSourceId" TEXT,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaPricingRule" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ruleType" "PricingRuleType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "nightlyPrice" DECIMAL(12,2) NOT NULL,
    "cleaningFee" DECIMAL(12,2),
    "minNightCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "createdByUserId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "discountMethod" "DiscountMethod" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "bannerLabel" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignVilla" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,

    CONSTRAINT "CampaignVilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "createdByUserId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountMethod" "DiscountMethod" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minimumStayNights" INTEGER,
    "minimumOrderAmount" DECIMAL(12,2),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponVilla" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,

    CONSTRAINT "CouponVilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "villaId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'NEW',
    "source" "RequestSource" NOT NULL DEFAULT 'WEB',
    "channelLabel" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "guestCount" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "preferredContactDate" TIMESTAMP(3),
    "preferredContactRange" TEXT,
    "message" TEXT,
    "couponCodeText" TEXT,
    "quotedBaseAmount" DECIMAL(12,2),
    "quotedDiscountAmount" DECIMAL(12,2),
    "quotedCleaningFee" DECIMAL(12,2),
    "quotedTotalAmount" DECIMAL(12,2),
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "confirmationToken" TEXT,
    "pricingSnapshot" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "bookingRequestId" TEXT NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT NOT NULL,
    "oldStatus" "BookingRequestStatus",
    "newStatus" "BookingRequestStatus" NOT NULL,
    "changedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTask" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "villaId" TEXT,
    "assigneeUserId" TEXT,
    "taskType" "OperationTaskType" NOT NULL,
    "status" "OperationTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "scheduledTimeLabel" TEXT,
    "assigneeLabel" TEXT,
    "supplierName" TEXT,
    "sourceLabel" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashLedgerEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "paymentId" TEXT,
    "invoiceId" TEXT,
    "bookingRequestId" TEXT,
    "createdByUserId" TEXT,
    "direction" "CashDirection" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "entryDate" TIMESTAMP(3) NOT NULL,
    "source" "CashEntrySource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "guestName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "source" "ReviewSource" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT NOT NULL,
    "staffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaViewEvent" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VillaViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaLiveSession" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaLiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaDailyMetric" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "couponUsageCount" INTEGER NOT NULL DEFAULT 0,
    "revenueTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "VillaDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "AgencyKind" NOT NULL,
    "ownerName" TEXT,
    "city" TEXT,
    "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "approvedRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "openPipeline" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "phone" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMessage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "recipientLabel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'NEW',
    "priority" "MessagePriority" NOT NULL DEFAULT 'MEDIUM',
    "relatedModule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "InternalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "scopeType" "CommissionScopeType" NOT NULL,
    "scopeRefId" TEXT,
    "scopeLabel" TEXT NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "payoutRule" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetRegion" TEXT,
    "focusKeyword" TEXT,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "heroText" TEXT,
    "leadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoContent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "title" TEXT NOT NULL,
    "contentType" "SeoContentType" NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "primaryKeyword" TEXT NOT NULL,
    "status" "SeoContentStatus" NOT NULL DEFAULT 'PLANNED',
    "seoScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncSource" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "direction" "CalendarDirection" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "CalendarSourceStatus" NOT NULL DEFAULT 'HEALTHY',
    "lastSyncedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncLeaseToken" TEXT,
    "syncLeaseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "remoteCalendarName" TEXT NOT NULL,
    "syncMode" "SyncMode" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceId" TEXT,
    "villaId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "outcome" "SyncOutcome" NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "buyRate" DECIMAL(12,4) NOT NULL,
    "sellRate" DECIMAL(12,4) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "status" "CurrencyRateStatus" NOT NULL DEFAULT 'LIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "feePercent" DECIMAL(5,2) NOT NULL,
    "settlementDays" INTEGER NOT NULL,
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'ACTIVE',
    "supportsInstallment" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" "CacheGroupStatus" NOT NULL DEFAULT 'HEALTHY',
    "ttlMinutes" INTEGER NOT NULL,
    "warmIntervalMinutes" INTEGER NOT NULL,
    "lastWarmedAt" TIMESTAMP(3),
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAsset" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "status" "DocumentAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortcutLink" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" "ShortcutStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortcutLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalService" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "ExternalServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "DocumentAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParameterGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "sampleItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ResourceDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParameterGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_primaryDomain_key" ON "Company"("primaryDomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "CompanyMembership_companyId_role_status_idx" ON "CompanyMembership"("companyId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMembership_companyId_userId_key" ON "CompanyMembership"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySetting_companyId_key" ON "CompanySetting"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyWebsite_companyId_slug_key" ON "CompanyWebsite"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Region_companyId_name_city_key" ON "Region"("companyId", "name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_code_key" ON "Airport"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_key_key" ON "Amenity"("key");

-- CreateIndex
CREATE INDEX "Villa_companyId_status_featured_idx" ON "Villa"("companyId", "status", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Villa_companyId_slug_key" ON "Villa"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Villa_companyId_shortCode_key" ON "Villa"("companyId", "shortCode");

-- CreateIndex
CREATE INDEX "VillaImage_villaId_sortOrder_idx" ON "VillaImage"("villaId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VillaAmenity_villaId_amenityId_key" ON "VillaAmenity"("villaId", "amenityId");

-- CreateIndex
CREATE INDEX "VillaAvailabilityBlock_villaId_startsAt_endsAt_idx" ON "VillaAvailabilityBlock"("villaId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "VillaAvailabilityBlock_calendarSourceId_externalEventId_key" ON "VillaAvailabilityBlock"("calendarSourceId", "externalEventId");

-- CreateIndex
CREATE INDEX "VillaPricingRule_villaId_startsAt_endsAt_isActive_idx" ON "VillaPricingRule"("villaId", "startsAt", "endsAt", "isActive");

-- CreateIndex
CREATE INDEX "Campaign_companyId_status_startsAt_endsAt_idx" ON "Campaign"("companyId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_companyId_slug_key" ON "Campaign"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignVilla_campaignId_villaId_key" ON "CampaignVilla"("campaignId", "villaId");

-- CreateIndex
CREATE INDEX "Coupon_companyId_status_startsAt_endsAt_idx" ON "Coupon"("companyId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_companyId_code_key" ON "Coupon"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponVilla_couponId_villaId_key" ON "CouponVilla"("couponId", "villaId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_confirmationToken_key" ON "BookingRequest"("confirmationToken");

-- CreateIndex
CREATE INDEX "BookingRequest_companyId_status_createdAt_idx" ON "BookingRequest"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingRequest_villaId_checkIn_checkOut_idx" ON "BookingRequest"("villaId", "checkIn", "checkOut");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_bookingRequestId_key" ON "CouponRedemption"("bookingRequestId");

-- CreateIndex
CREATE INDEX "BookingRequestStatusHistory_bookingRequestId_createdAt_idx" ON "BookingRequestStatusHistory"("bookingRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationTask_companyId_status_scheduledAt_idx" ON "OperationTask"("companyId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OperationTask_villaId_taskType_idx" ON "OperationTask"("villaId", "taskType");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingRequestId_key" ON "Invoice"("bookingRequestId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_dueDate_idx" ON "Invoice"("companyId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_companyId_status_dueDate_idx" ON "Payment"("companyId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_companyId_entryDate_direction_idx" ON "CashLedgerEntry"("companyId", "entryDate", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "GuestReview_bookingRequestId_key" ON "GuestReview"("bookingRequestId");

-- CreateIndex
CREATE INDEX "GuestReview_companyId_status_createdAt_idx" ON "GuestReview"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VillaViewEvent_villaId_createdAt_idx" ON "VillaViewEvent"("villaId", "createdAt");

-- CreateIndex
CREATE INDEX "VillaViewEvent_sessionId_idx" ON "VillaViewEvent"("sessionId");

-- CreateIndex
CREATE INDEX "VillaLiveSession_lastSeenAt_idx" ON "VillaLiveSession"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "VillaLiveSession_villaId_sessionId_key" ON "VillaLiveSession"("villaId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "VillaDailyMetric_villaId_metricDate_key" ON "VillaDailyMetric"("villaId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_companyId_name_key" ON "Agency"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_name_key" ON "Branch"("companyId", "name");

-- CreateIndex
CREATE INDEX "InternalMessage_companyId_status_createdAt_idx" ON "InternalMessage"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionRule_companyId_scopeType_active_idx" ON "CommissionRule"("companyId", "scopeType", "active");

-- CreateIndex
CREATE INDEX "LandingPage_companyId_status_updatedAt_idx" ON "LandingPage"("companyId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_companyId_slug_key" ON "LandingPage"("companyId", "slug");

-- CreateIndex
CREATE INDEX "SeoContent_companyId_status_updatedAt_idx" ON "SeoContent"("companyId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "BlogPost_companyId_status_publishedAt_idx" ON "BlogPost"("companyId", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_companyId_slug_key" ON "BlogPost"("companyId", "slug");

-- CreateIndex
CREATE INDEX "CalendarSyncSource_active_direction_nextSyncAt_idx" ON "CalendarSyncSource"("active", "direction", "nextSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSyncSource_companyId_villaId_channelName_direction_key" ON "CalendarSyncSource"("companyId", "villaId", "channelName", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSyncMapping_companyId_villaId_channelName_key" ON "CalendarSyncMapping"("companyId", "villaId", "channelName");

-- CreateIndex
CREATE INDEX "CalendarSyncLog_companyId_createdAt_idx" ON "CalendarSyncLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_companyId_code_key" ON "CurrencyRate"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_companyId_label_key" ON "PaymentMethod"("companyId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "CacheGroup_companyId_label_key" ON "CacheGroup"("companyId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "ParameterGroup_companyId_label_key" ON "ParameterGroup"("companyId", "label");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySetting" ADD CONSTRAINT "CompanySetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyWebsite" ADD CONSTRAINT "CompanyWebsite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Airport" ADD CONSTRAINT "Airport_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Villa" ADD CONSTRAINT "Villa_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Villa" ADD CONSTRAINT "Villa_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Villa" ADD CONSTRAINT "Villa_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Villa" ADD CONSTRAINT "Villa_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaImage" ADD CONSTRAINT "VillaImage_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaAmenity" ADD CONSTRAINT "VillaAmenity_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaAmenity" ADD CONSTRAINT "VillaAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaAvailabilityBlock" ADD CONSTRAINT "VillaAvailabilityBlock_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaAvailabilityBlock" ADD CONSTRAINT "VillaAvailabilityBlock_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaAvailabilityBlock" ADD CONSTRAINT "VillaAvailabilityBlock_calendarSourceId_fkey" FOREIGN KEY ("calendarSourceId") REFERENCES "CalendarSyncSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaPricingRule" ADD CONSTRAINT "VillaPricingRule_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVilla" ADD CONSTRAINT "CampaignVilla_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVilla" ADD CONSTRAINT "CampaignVilla_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponVilla" ADD CONSTRAINT "CouponVilla_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponVilla" ADD CONSTRAINT "CouponVilla_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequestStatusHistory" ADD CONSTRAINT "BookingRequestStatusHistory_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequestStatusHistory" ADD CONSTRAINT "BookingRequestStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReview" ADD CONSTRAINT "GuestReview_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaViewEvent" ADD CONSTRAINT "VillaViewEvent_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaLiveSession" ADD CONSTRAINT "VillaLiveSession_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaDailyMetric" ADD CONSTRAINT "VillaDailyMetric_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoContent" ADD CONSTRAINT "SeoContent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoContent" ADD CONSTRAINT "SeoContent_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CompanyWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncSource" ADD CONSTRAINT "CalendarSyncSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncSource" ADD CONSTRAINT "CalendarSyncSource_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncMapping" ADD CONSTRAINT "CalendarSyncMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncMapping" ADD CONSTRAINT "CalendarSyncMapping_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncLog" ADD CONSTRAINT "CalendarSyncLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncLog" ADD CONSTRAINT "CalendarSyncLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalendarSyncSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncLog" ADD CONSTRAINT "CalendarSyncLog_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyRate" ADD CONSTRAINT "CurrencyRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CacheGroup" ADD CONSTRAINT "CacheGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAsset" ADD CONSTRAINT "DocumentAsset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortcutLink" ADD CONSTRAINT "ShortcutLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalService" ADD CONSTRAINT "ExternalService_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterGroup" ADD CONSTRAINT "ParameterGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
