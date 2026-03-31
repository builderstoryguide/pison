-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN "defaultDailyClosureTime" TEXT NOT NULL DEFAULT '18:00';

-- AlterTable
ALTER TABLE "DailySession" ADD COLUMN "plannedClosureAt" TIMESTAMP(3);
