-- CreateEnum
CREATE TYPE "public"."AreaStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('CLIENT', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'COLLECTION', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'TRANSFER', 'COMMISSION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'PAID_OFF', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');

-- CreateTable
CREATE TABLE "public"."CollectionArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "region" TEXT,
    "status" "public"."AreaStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "CollectionArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinancialAccount" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" "public"."AccountType" NOT NULL,
    "balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "areaId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "public"."ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCommissionExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "accountId" TEXT NOT NULL,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentAreaAssignment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "AgentAreaAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "balanceBefore" DECIMAL(19,4) NOT NULL,
    "balanceAfter" DECIMAL(19,4) NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "description" TEXT,
    "reference" TEXT,
    "areaId" TEXT,
    "agentId" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" TEXT NOT NULL,
    "loanNumber" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "principalAmount" DECIMAL(19,4) NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "remainingBalance" DECIMAL(19,4) NOT NULL,
    "status" "public"."LoanStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT,
    "disbursedAt" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "principal" DECIMAL(19,4) NOT NULL,
    "interest" DECIMAL(19,4) NOT NULL,
    "repaidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commission" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailySession" (
    "id" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedBy" TEXT,
    "closedBy" TEXT,

    CONSTRAINT "DailySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyClosure" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "closureDate" DATE NOT NULL,
    "totalCollections" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "physicalCash" DECIMAL(19,4),
    "systemBalance" DECIMAL(19,4) NOT NULL,
    "surplusShortage" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closedBy" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "transactionId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionArea_code_key" ON "public"."CollectionArea"("code");

-- CreateIndex
CREATE INDEX "CollectionArea_code_idx" ON "public"."CollectionArea"("code");

-- CreateIndex
CREATE INDEX "CollectionArea_status_idx" ON "public"."CollectionArea"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_accountNumber_key" ON "public"."FinancialAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountNumber_idx" ON "public"."FinancialAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountType_idx" ON "public"."FinancialAccount"("accountType");

-- CreateIndex
CREATE INDEX "FinancialAccount_status_idx" ON "public"."FinancialAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "public"."Client"("clientNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "public"."Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_accountId_key" ON "public"."Client"("accountId");

-- CreateIndex
CREATE INDEX "Client_clientNumber_idx" ON "public"."Client"("clientNumber");

-- CreateIndex
CREATE INDEX "Client_areaId_idx" ON "public"."Client"("areaId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "public"."Client"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentCode_key" ON "public"."Agent"("agentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "public"."Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_accountId_key" ON "public"."Agent"("accountId");

-- CreateIndex
CREATE INDEX "Agent_agentCode_idx" ON "public"."Agent"("agentCode");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "public"."Agent"("status");

-- CreateIndex
CREATE INDEX "AgentAreaAssignment_agentId_idx" ON "public"."AgentAreaAssignment"("agentId");

-- CreateIndex
CREATE INDEX "AgentAreaAssignment_areaId_idx" ON "public"."AgentAreaAssignment"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentAreaAssignment_agentId_areaId_key" ON "public"."AgentAreaAssignment"("agentId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionNumber_key" ON "public"."Transaction"("transactionNumber");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "public"."Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "public"."Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "public"."Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "public"."Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_areaId_idx" ON "public"."Transaction"("areaId");

-- CreateIndex
CREATE INDEX "Transaction_agentId_idx" ON "public"."Transaction"("agentId");

-- CreateIndex
CREATE INDEX "Transaction_transactionNumber_idx" ON "public"."Transaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanNumber_key" ON "public"."Loan"("loanNumber");

-- CreateIndex
CREATE INDEX "Loan_loanNumber_idx" ON "public"."Loan"("loanNumber");

-- CreateIndex
CREATE INDEX "Loan_accountId_idx" ON "public"."Loan"("accountId");

-- CreateIndex
CREATE INDEX "Loan_clientId_idx" ON "public"."Loan"("clientId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "public"."Loan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_transactionId_key" ON "public"."LoanRepayment"("transactionId");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_idx" ON "public"."LoanRepayment"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_transactionId_key" ON "public"."Commission"("transactionId");

-- CreateIndex
CREATE INDEX "Commission_clientId_idx" ON "public"."Commission"("clientId");

-- CreateIndex
CREATE INDEX "Commission_period_idx" ON "public"."Commission"("period");

-- CreateIndex
CREATE INDEX "Commission_calculatedAt_idx" ON "public"."Commission"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailySession_sessionDate_key" ON "public"."DailySession"("sessionDate");

-- CreateIndex
CREATE INDEX "DailySession_sessionDate_idx" ON "public"."DailySession"("sessionDate");

-- CreateIndex
CREATE INDEX "DailySession_status_idx" ON "public"."DailySession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyClosure_sessionId_key" ON "public"."DailyClosure"("sessionId");

-- CreateIndex
CREATE INDEX "DailyClosure_closureDate_idx" ON "public"."DailyClosure"("closureDate");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "public"."AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "public"."AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."CollectionArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentAreaAssignment" ADD CONSTRAINT "AgentAreaAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentAreaAssignment" ADD CONSTRAINT "AgentAreaAssignment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."CollectionArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."CollectionArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoanRepayment" ADD CONSTRAINT "LoanRepayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySession" ADD CONSTRAINT "DailySession_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySession" ADD CONSTRAINT "DailySession_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyClosure" ADD CONSTRAINT "DailyClosure_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."DailySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyClosure" ADD CONSTRAINT "DailyClosure_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
