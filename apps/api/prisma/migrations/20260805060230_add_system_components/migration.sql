-- CreateEnum
CREATE TYPE "SystemCategory" AS ENUM ('SERVER', 'MANAGEMENT_SYSTEM', 'NETWORK');

-- CreateEnum
CREATE TYPE "SystemStatus" AS ENUM ('ACTIVE', 'WARNING', 'DOWN');

-- CreateTable
CREATE TABLE "system_components" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SystemCategory" NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "loadPct" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_components_tenantId_idx" ON "system_components"("tenantId");

-- AddForeignKey
ALTER TABLE "system_components" ADD CONSTRAINT "system_components_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
