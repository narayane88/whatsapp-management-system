-- AlterTable
ALTER TABLE "public"."customer_packages" ADD COLUMN     "previousSubscriptionId" TEXT,
ADD COLUMN     "purchaseType" TEXT NOT NULL DEFAULT 'IMMEDIATE',
ADD COLUMN     "scheduledStartDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "idx_customer_packages_status" ON "public"."customer_packages"("status");

-- CreateIndex
CREATE INDEX "idx_customer_packages_scheduled_start" ON "public"."customer_packages"("scheduledStartDate");
