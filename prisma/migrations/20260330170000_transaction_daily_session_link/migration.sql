-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "dailySessionId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_dailySessionId_idx" ON "Transaction"("dailySessionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "DailySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
