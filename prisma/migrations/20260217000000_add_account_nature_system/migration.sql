-- CreateEnum
CREATE TYPE "MaintenanceFeeType" AS ENUM ('MONTHLY', 'INITIAL');

-- CreateTable
CREATE TABLE "AccountNature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minBalance" DECIMAL(19,4),
    "minOpeningContribution" DECIMAL(19,4),
    "interestRateDefault" DECIMAL(5,4),
    "interestRateMin" DECIMAL(5,4),
    "interestRateMax" DECIMAL(5,4),
    "interestRateNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceFee" DECIMAL(19,4),
    "maintenanceFeeType" "MaintenanceFeeType",
    "transactionFee" DECIMAL(19,4),
    "transactionFeeVariable" BOOLEAN NOT NULL DEFAULT false,
    "openingFee" DECIMAL(19,4),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedDurationMonths" INTEGER,
    "minTermMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "allowDeposit" BOOLEAN NOT NULL DEFAULT true,
    "allowWithdrawal" BOOLEAN NOT NULL DEFAULT true,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountNatureDocument" (
    "id" TEXT NOT NULL,
    "accountNatureId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AccountNatureDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxAmount" DECIMAL(19,4) NOT NULL,
    "maxDurationDays" INTEGER NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "minDailyCollectionMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN "accountNatureId" TEXT,
ADD COLUMN "blockedUntil" TIMESTAMP(3),
ADD COLUMN "maturityDate" TIMESTAMP(3),
ADD COLUMN "customInterestRate" DECIMAL(5,4);

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "documentChecklist" JSONB;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "loanProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountNature_code_key" ON "AccountNature"("code");
CREATE INDEX "AccountNature_code_idx" ON "AccountNature"("code");
CREATE INDEX "AccountNature_isActive_idx" ON "AccountNature"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_code_key" ON "DocumentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountNatureDocument_accountNatureId_documentTypeId_key" ON "AccountNatureDocument"("accountNatureId", "documentTypeId");
CREATE INDEX "AccountNatureDocument_accountNatureId_idx" ON "AccountNatureDocument"("accountNatureId");
CREATE INDEX "AccountNatureDocument_documentTypeId_idx" ON "AccountNatureDocument"("documentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_code_key" ON "LoanProduct"("code");
CREATE INDEX "LoanProduct_code_idx" ON "LoanProduct"("code");
CREATE INDEX "LoanProduct_isActive_idx" ON "LoanProduct"("isActive");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountNatureId_idx" ON "FinancialAccount"("accountNatureId");

-- CreateIndex
CREATE INDEX "Loan_loanProductId_idx" ON "Loan"("loanProductId");

-- AddForeignKey
ALTER TABLE "AccountNatureDocument" ADD CONSTRAINT "AccountNatureDocument_accountNatureId_fkey" FOREIGN KEY ("accountNatureId") REFERENCES "AccountNature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNatureDocument" ADD CONSTRAINT "AccountNatureDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_accountNatureId_fkey" FOREIGN KEY ("accountNatureId") REFERENCES "AccountNature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "LoanProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
