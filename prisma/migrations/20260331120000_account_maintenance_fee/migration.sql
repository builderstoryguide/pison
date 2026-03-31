-- AlterEnum: add ACCOUNT_MAINTENANCE_FEE to TransactionType
ALTER TYPE "TransactionType" ADD VALUE 'ACCOUNT_MAINTENANCE_FEE';

-- SystemSetting: monthly maintenance automation
ALTER TABLE "SystemSetting"
ADD COLUMN "maintenanceFeeBillingDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "maintenanceFeeAutomationEnabled" BOOLEAN NOT NULL DEFAULT false;
