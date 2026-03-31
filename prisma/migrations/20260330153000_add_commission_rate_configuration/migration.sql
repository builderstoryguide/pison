-- Add configurable commission rates:
-- - System-wide default rate on SystemSetting
-- - Optional per-client override on Client
ALTER TABLE "SystemSetting"
ADD COLUMN "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.02;

ALTER TABLE "Client"
ADD COLUMN "commissionRateOverride" DECIMAL(5,4);
