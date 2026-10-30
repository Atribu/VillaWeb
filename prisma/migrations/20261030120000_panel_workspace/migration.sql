ALTER TYPE "MembershipRole" ADD VALUE IF NOT EXISTS 'OWNER';

CREATE TABLE "PanelWorkRecord" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "userId" TEXT,
  "data" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PanelWorkRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PanelWorkRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PanelWorkRecord_companyId_kind_subjectId_key" ON "PanelWorkRecord"("companyId", "kind", "subjectId");
CREATE INDEX "PanelWorkRecord_companyId_kind_userId_idx" ON "PanelWorkRecord"("companyId", "kind", "userId");
