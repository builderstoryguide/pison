-- AlterEnum (PostgreSQL appends new values)
ALTER TYPE "AccountType" ADD VALUE 'MANAGER';
ALTER TYPE "AccountType" ADD VALUE 'ACCOUNTANT';

ALTER TYPE "TransactionType" ADD VALUE 'TREASURY_ISSUANCE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "operatingAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_operatingAccountId_key" ON "User"("operatingAccountId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_operatingAccountId_fkey" FOREIGN KEY ("operatingAccountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");
