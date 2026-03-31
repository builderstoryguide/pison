/**
 * Monthly account maintenance debits from AccountNature (MONTHLY maintenanceFee).
 * Posts COMPLETED ACCOUNT_MAINTENANCE_FEE without daily session / four-eye flow.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSystemUserId } from '@/lib/system-user';
import {
  getDbNow,
  transactionNumberDatePrefix,
} from '@/lib/utils/db-time';
import {
  getZonedYmd,
  isMaintenanceBillingDay,
  periodFromZonedYmd,
} from '@/lib/utils/institution-calendar';
import {
  invalidateAdminRecentTransactions,
  invalidateCountCacheForEntity,
  invalidateDashboardStats,
  invalidateTransactionListCache,
  invalidateRecentTransactionsForAccount,
  invalidateAll,
} from '@/lib/cache';

export interface MaintenanceFeeRunSummary {
  period: string;
  charged: number;
  skippedAlreadyCharged: number;
  skippedInsufficientFunds: number;
  skippedDisabled: boolean;
  errors: Array<{ accountId: string; message: string }>;
}

function maintenanceReference(period: string, accountId: string): string {
  return `maint-fee:${period}:${accountId}`;
}

async function generateTransactionNumber(tx: Prisma.TransactionClient): Promise<string> {
  const dbNow = await getDbNow(tx);
  const dateStr = transactionNumberDatePrefix(dbNow);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const transactionNumber = `TXN-${dateStr}-${random}`;
  const exists = await tx.transaction.findUnique({
    where: { transactionNumber },
  });
  if (exists) {
    return generateTransactionNumber(tx);
  }
  return transactionNumber;
}

export class MaintenanceFeeService {
  /**
   * Whether automation is on and today's calendar date in `timezone` matches the billing day.
   */
  async shouldRunScheduledBilling(now: Date = new Date()): Promise<{
    run: boolean;
    settings: {
      timezone: string;
      maintenanceFeeBillingDay: number;
      maintenanceFeeAutomationEnabled: boolean;
    };
  }> {
    const settings = await this.getSettings();
    if (!settings.maintenanceFeeAutomationEnabled) {
      return { run: false, settings };
    }
    const tz = settings.timezone || 'UTC';
    const day = settings.maintenanceFeeBillingDay;
    if (day < 1 || day > 31) {
      return { run: false, settings };
    }
    const billing = isMaintenanceBillingDay(now, tz, day);
    return { run: billing, settings };
  }

  async getSettings() {
    const row = await prisma.systemSetting.findFirst({
      select: {
        timezone: true,
        maintenanceFeeBillingDay: true,
        maintenanceFeeAutomationEnabled: true,
      },
    });
    return {
      timezone: row?.timezone ?? 'UTC',
      maintenanceFeeBillingDay: row?.maintenanceFeeBillingDay ?? 1,
      maintenanceFeeAutomationEnabled: row?.maintenanceFeeAutomationEnabled ?? false,
    };
  }

  /** Current YYYY-MM in institution timezone. */
  currentPeriodInTimezone(timezone: string, at: Date = new Date()): string {
    const { y, m } = getZonedYmd(at, timezone || 'UTC');
    return periodFromZonedYmd(y, m);
  }

  /**
   * Apply monthly maintenance for all eligible client accounts for `period` (YYYY-MM).
   */
  async runMonthlyMaintenanceForPeriod(
    period: string,
    options?: { ignoreAutomationDisabled?: boolean },
  ): Promise<MaintenanceFeeRunSummary> {
    const periodMatch = /^\d{4}-(0[1-9]|1[0-2])$/.exec(period);
    if (!periodMatch) {
      throw new Error('Invalid period; expected YYYY-MM');
    }

    const settings = await prisma.systemSetting.findFirst({
      select: {
        maintenanceFeeAutomationEnabled: true,
      },
    });
    const enabled = settings?.maintenanceFeeAutomationEnabled ?? false;
    if (!enabled && !options?.ignoreAutomationDisabled) {
      return {
        period,
        charged: 0,
        skippedAlreadyCharged: 0,
        skippedInsufficientFunds: 0,
        skippedDisabled: true,
        errors: [],
      };
    }

    const systemUserId = await getSystemUserId();

    const accounts = await prisma.financialAccount.findMany({
      where: {
        accountType: 'CLIENT',
        status: 'ACTIVE',
        accountNature: {
          maintenanceFeeType: 'MONTHLY',
          maintenanceFee: { gt: 0 },
        },
        client: {
          approvalStatus: 'APPROVED',
        },
      },
      include: {
        accountNature: { select: { id: true, name: true, maintenanceFee: true } },
        client: { select: { id: true } },
      },
    });

    let charged = 0;
    let skippedAlreadyCharged = 0;
    let skippedInsufficientFunds = 0;
    const errors: Array<{ accountId: string; message: string }> = [];
    const chargedAccountIds: string[] = [];

    for (const account of accounts) {
      const nature = account.accountNature;
      if (!nature?.maintenanceFee) {
        continue;
      }
      const feeAmount = nature.maintenanceFee.toNumber();
      if (feeAmount <= 0) {
        continue;
      }

      const reference = maintenanceReference(period, account.id);
      const existing = await prisma.transaction.findFirst({
        where: { reference },
        select: { id: true },
      });
      if (existing) {
        skippedAlreadyCharged += 1;
        continue;
      }

      const avail = account.availableBalance.toNumber();
      if (avail + 1e-9 < feeAmount) {
        skippedInsufficientFunds += 1;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          const fresh = await tx.financialAccount.findUnique({
            where: { id: account.id },
          });
          if (!fresh || fresh.status !== 'ACTIVE') {
            throw new Error('Account no longer active');
          }
          const feeDec = new Prisma.Decimal(feeAmount);
          const availNow = fresh.availableBalance.toNumber();
          if (availNow + 1e-9 < feeAmount) {
            throw new Error('Insufficient available balance');
          }
          const balBefore = fresh.balance;
          const balNum =
            balBefore instanceof Prisma.Decimal ? balBefore.toNumber() : Number(balBefore);
          const balanceAfter = new Prisma.Decimal(balNum - feeAmount);
          const availableAfter = new Prisma.Decimal(availNow - feeAmount);

          const dup = await tx.transaction.findFirst({
            where: { reference },
            select: { id: true },
          });
          if (dup) {
            throw new Error('Already charged (race)');
          }

          const transactionNumber = await generateTransactionNumber(tx);
          const approvedAt = await getDbNow(tx);
          const description = `Monthly maintenance — ${period} (${nature.name})`;

          const txn = await tx.transaction.create({
            data: {
              transactionNumber,
              accountId: account.id,
              clientId: account.client?.id,
              type: 'ACCOUNT_MAINTENANCE_FEE',
              amount: feeDec,
              balanceBefore: balBefore,
              balanceAfter,
              status: 'COMPLETED',
              description,
              reference,
              createdBy: systemUserId,
              approvedBy: systemUserId,
              approvedAt,
            },
          });

          await tx.financialAccount.update({
            where: { id: account.id },
            data: {
              balance: balanceAfter,
              availableBalance: availableAfter,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: systemUserId,
              action: 'MAINTENANCE_FEE',
              entityType: 'TRANSACTION',
              entityId: txn.id,
              transactionId: txn.id,
              description: `${description} — ${txn.transactionNumber}`,
              changes: { period, accountId: account.id, amount: feeAmount },
            },
          });
        });
        charged += 1;
        chargedAccountIds.push(account.id);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes('Already charged') || message.includes('race')) {
          skippedAlreadyCharged += 1;
        } else if (message.includes('Insufficient')) {
          skippedInsufficientFunds += 1;
        } else if (message.includes('no longer active')) {
          /* skip */
        } else {
          errors.push({ accountId: account.id, message });
        }
      }
    }

    if (chargedAccountIds.length > 0) {
      const ops: Promise<unknown>[] = [
        invalidateAdminRecentTransactions(),
        invalidateCountCacheForEntity('transactions'),
        invalidateTransactionListCache(),
        invalidateDashboardStats(),
      ];
      for (const id of chargedAccountIds) {
        ops.push(invalidateRecentTransactionsForAccount(id));
      }
      await invalidateAll(...ops);
    }

    return {
      period,
      charged,
      skippedAlreadyCharged,
      skippedInsufficientFunds,
      skippedDisabled: false,
      errors,
    };
  }

  /**
   * Aggregates for manager report: totals by month and optional breakdown by account nature name.
   */
  async getMaintenanceFeeReport(params: { from: Date; to: Date }) {
    const tz = (await this.getSettings()).timezone || 'UTC';
    const txns = await prisma.transaction.findMany({
      where: {
        type: 'ACCOUNT_MAINTENANCE_FEE',
        status: 'COMPLETED',
        createdAt: { gte: params.from, lte: params.to },
      },
      select: {
        amount: true,
        createdAt: true,
        reference: true,
        account: {
          select: {
            accountNature: { select: { name: true, code: true } },
          },
        },
      },
    });

    const byMonth = new Map<string, { count: number; total: Prisma.Decimal }>();
    const byNature = new Map<string, { count: number; total: Prisma.Decimal }>();

    for (const t of txns) {
      const { y, m } = getZonedYmd(t.createdAt, tz);
      const key = periodFromZonedYmd(y, m);
      const prevM = byMonth.get(key) ?? { count: 0, total: new Prisma.Decimal(0) };
      prevM.count += 1;
      prevM.total = prevM.total.add(t.amount);
      byMonth.set(key, prevM);

      const natureName = t.account.accountNature?.name ?? 'Unknown';
      const prevN = byNature.get(natureName) ?? { count: 0, total: new Prisma.Decimal(0) };
      prevN.count += 1;
      prevN.total = prevN.total.add(t.amount);
      byNature.set(natureName, prevN);
    }

    const monthly = Array.from(byMonth, ([period, v]) => ({
      period,
      count: v.count,
      total: v.total.toNumber(),
    })).sort((a, b) => a.period.localeCompare(b.period));

    const byAccountNature = Array.from(byNature, ([accountNatureName, v]) => ({
      accountNatureName,
      count: v.count,
      total: v.total.toNumber(),
    })).sort((a, b) => a.accountNatureName.localeCompare(b.accountNatureName));

    const grandTotal = txns.reduce(
      (acc, t) => acc.add(t.amount),
      new Prisma.Decimal(0),
    );

    return {
      monthly,
      byAccountNature,
      transactionCount: txns.length,
      grandTotal: grandTotal.toNumber(),
    };
  }
}

export const maintenanceFeeService = new MaintenanceFeeService();
