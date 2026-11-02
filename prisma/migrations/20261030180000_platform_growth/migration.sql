-- AlterTable
ALTER TABLE "VillaPricingRule" ADD COLUMN     "earlyBookingDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "earlyBookingPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "weekendPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "portfolioCommission" DECIMAL(12,2),
ADD COLUMN     "portfolioShareId" TEXT,
ADD COLUMN     "portfolioShareVersion" INTEGER;

-- CreateTable
CREATE TABLE "CompanyPlatformConfig" (
    "companyId" TEXT NOT NULL,
    "package" JSONB,
    "siteDraft" JSONB,
    "sitePublished" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPlatformConfig_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "VillaShare" (
    "id" TEXT NOT NULL,
    "sourceCompanyId" TEXT NOT NULL,
    "recipientCompanyId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "nightlyPrice" DECIMAL(12,2) NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSecondFactor" (
    "userId" TEXT NOT NULL,
    "secretCipher" TEXT,
    "pendingCipher" TEXT,
    "pendingExpiresAt" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "lastStep" INTEGER NOT NULL DEFAULT -1,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "recoveryHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "AuthSecondFactor_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FunnelVisit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VillaShare_recipientCompanyId_state_idx" ON "VillaShare"("recipientCompanyId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "VillaShare_villaId_recipientCompanyId_key" ON "VillaShare"("villaId", "recipientCompanyId");

-- CreateIndex
CREATE INDEX "FunnelVisit_companyId_day_source_idx" ON "FunnelVisit"("companyId", "day", "source");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelVisit_companyId_villaId_sessionHash_day_key" ON "FunnelVisit"("companyId", "villaId", "sessionHash", "day");

-- AddForeignKey
ALTER TABLE "CompanyPlatformConfig" ADD CONSTRAINT "CompanyPlatformConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaShare" ADD CONSTRAINT "VillaShare_sourceCompanyId_fkey" FOREIGN KEY ("sourceCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaShare" ADD CONSTRAINT "VillaShare_recipientCompanyId_fkey" FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VillaShare" ADD CONSTRAINT "VillaShare_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSecondFactor" ADD CONSTRAINT "AuthSecondFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_portfolioShareId_fkey" FOREIGN KEY ("portfolioShareId") REFERENCES "VillaShare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VillaShare" ADD CONSTRAINT "VillaShare_valid_terms" CHECK (
  "sourceCompanyId" <> "recipientCompanyId" AND "nightlyPrice" > 0
  AND "commissionPercent" BETWEEN 0 AND 100 AND "state" IN ('PENDING', 'ACTIVE', 'REVOKED')
);
ALTER TABLE "VillaPricingRule" ADD CONSTRAINT "VillaPricingRule_advanced_bounds" CHECK (
  "weekendPercent" BETWEEN -90 AND 500 AND "earlyBookingDays" BETWEEN 0 AND 730
  AND "earlyBookingPercent" BETWEEN 0 AND 90 AND ("earlyBookingPercent" = 0 OR "earlyBookingDays" > 0)
);
