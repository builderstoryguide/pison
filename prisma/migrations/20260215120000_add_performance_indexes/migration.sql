-- CreateIndex
CREATE INDEX "User_roleId_status_idx" ON "User"("roleId", "status");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountType_status_idx" ON "FinancialAccount"("accountType", "status");

-- CreateIndex
CREATE INDEX "Transaction_accountId_createdAt_desc_idx" ON "Transaction"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_agentId_createdAt_idx" ON "Transaction"("agentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Loan_clientId_status_maturityDate_idx" ON "Loan"("clientId", "status", "maturityDate");

-- CreateIndex
CREATE INDEX "Loan_createdBy_status_idx" ON "Loan"("createdBy", "status");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_repaidAt_idx" ON "LoanRepayment"("loanId", "repaidAt" DESC);

-- CreateIndex
CREATE INDEX "LoanRepayment_repaidAt_idx" ON "LoanRepayment"("repaidAt");
