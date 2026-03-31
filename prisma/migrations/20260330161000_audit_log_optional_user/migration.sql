-- AlterTable: allow auth events without a resolved user (e.g. unknown identifier)
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
