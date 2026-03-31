/**
 * Commission Service
 * Handles automatic commission calculation
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { capLimit } from '@/lib/utils/pagination';
import { transactionService } from './transaction-service';
import { getCachedOrFetch } from '@/lib/cache/query-cache';
import { LIST_PREFIX_COMMISSIONS } from '@/lib/cache/keys';

const COMMISSION_LIST_TTL = 300;

export interface CommissionCalculationResult {
  transactionId: string;
  clientId: string;
  amount: number;
  rate: number;
  commission: number;
}

export class CommissionService {
  private rateDecimalToPercent(rateDecimal: number): number {
    return Number((rateDecimal * 100).toFixed(2));
  }

  /**
   * Get commission rate for a client
   */
  async getCommissionRate(clientId: string): Promise<number> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        isCommissionExempt: true,
        commissionRateOverride: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // If client is commission exempt, return 0
    if (client.isCommissionExempt) {
      return 0;
    }

    if (client.commissionRateOverride !== null) {
      return client.commissionRateOverride.toNumber();
    }

    const systemSetting = await prisma.systemSetting.findFirst({
      select: { commissionRate: true },
    });

    return systemSetting?.commissionRate.toNumber() ?? 0.02;
  }

  /**
   * Get commission rate as whole percent for manager-facing settings.
   */
  async getCommissionRatePercent(clientId: string): Promise<number> {
    const rateDecimal = await this.getCommissionRate(clientId);
    return this.rateDecimalToPercent(rateDecimal);
  }

  /**
   * Check if client is commission exempt
   */
  async isCommissionExempt(clientId: string): Promise<boolean> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { isCommissionExempt: true },
    });

    return client?.isCommissionExempt || false;
  }

  /**
   * Calculate commission for a single withdrawal transaction
   */
  async calculateCommissionForTransaction(
    transactionId: string,
  ): Promise<CommissionCalculationResult | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Only withdrawal transactions incur commissions
    if (transaction.type !== 'WITHDRAWAL') {
      return null;
    }

    // Check if commission already calculated
    const existingCommission = await prisma.commission.findUnique({
      where: { transactionId },
    });

    if (existingCommission) {
      return {
        transactionId,
        clientId: transaction.account.client?.id || '',
        amount: transaction.amount.toNumber(),
        rate: existingCommission.rate.toNumber(),
        commission: existingCommission.amount.toNumber(),
      };
    }

    // Get client
    const client = transaction.account.client;
    if (!client) {
      return null; // Not a client account
    }

    // Check if exempt
    if (client.isCommissionExempt) {
      return null;
    }

    // Get commission rate
    const rate = await this.getCommissionRate(client.id);

    if (rate === 0) {
      return null;
    }

    // Calculate commission using Decimal for precision (never JS floats for money)
    const commissionDecimal = transaction.amount.mul(rate).toDecimalPlaces(4);
    const commission = commissionDecimal.toNumber();

    return {
      transactionId,
      clientId: client.id,
      amount: transaction.amount.toNumber(),
      rate,
      commission,
    };
  }

  /**
   * Calculate commissions for a period (month)
   */
  async calculateCommissions(
    period: string,
  ): Promise<CommissionCalculationResult[]> {
    // Parse period (format: YYYY-MM)
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all withdrawal transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        accountId: true,
        account: {
          select: {
            client: { select: { id: true } },
          },
        },
      },
    });

    const results: CommissionCalculationResult[] = [];

    for (const transaction of transactions) {
      const result = await this.calculateCommissionForTransaction(
        transaction.id,
      );
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Create commission records and transactions for a period
   */
  async createCommissionsForPeriod(period: string, userId: string) {
    const calculations = await this.calculateCommissions(period);

    // Filter out already existing commissions (where we fetched them from DB)
    // We can check if a commission record already exists for the transactionId
    // But calculateCommissions returns the structure.
    // Let's filter by checking DB again or better, try to create and ignore duplicates?
    // Better: Check existence before create.

    const createdCommissions = [];

    for (const calc of calculations) {
      // Use a transaction to ensure atomicity: commission + COMMISSION ledger entry in same tx
      const result = await prisma.$transaction(async (tx) => {
        const exists = await tx.commission.findUnique({
          where: { transactionId: calc.transactionId },
        });

        if (exists) {
          return null;
        }

        const commission = await tx.commission.create({
          data: {
            transactionId: calc.transactionId,
            clientId: calc.clientId,
            amount: calc.commission,
            rate: calc.rate,
            calculationMethod: 'PERCENTAGE',
            period,
          },
        });

        const withdrawalTxn = await tx.transaction.findUnique({
          where: { id: calc.transactionId },
        });

        if (!withdrawalTxn) {
          throw new Error(
            `Commission created for transaction ${calc.transactionId} but withdrawal transaction not found. Cannot create ledger entry.`
          );
        }

        // Create COMMISSION ledger entry inside same tx for consistency
        const ledgerTxn = await transactionService.createTransaction(
          {
            accountId: withdrawalTxn.accountId,
            type: 'COMMISSION',
            amount: calc.commission,
            description: `Commission for withdrawal transaction ${withdrawalTxn.transactionNumber}`,
          },
          userId,
          tx,
        );

        // Auto-approve the commission transaction to deduct balance immediately
        await transactionService.approveTransaction(
          ledgerTxn.id,
          userId,
          'System generated commission',
          tx
        );

        return { commission, ledgerTxn };
      });

      if (result) {
        createdCommissions.push(result.commission);
      }
    }

    return createdCommissions;
  }

  /**
   * Get commissions for a period
   */
  async getCommissions(period?: string, clientId?: string, filters?: { limit?: number; offset?: number }) {
    const where: Prisma.CommissionWhereInput = {};

    if (period) {
      where.period = period;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const cacheParams = {
      period,
      clientId,
      limit: capLimit(filters?.limit),
      offset: filters?.offset ?? 0,
    };

    return getCachedOrFetch(LIST_PREFIX_COMMISSIONS, cacheParams, COMMISSION_LIST_TTL, () =>
      prisma.commission.findMany({
        where,
        select: {
          id: true,
          transactionId: true,
          clientId: true,
          amount: true,
          rate: true,
          period: true,
          calculatedAt: true,
          transaction: {
            select: {
              transactionNumber: true,
              amount: true,
              account: {
                select: { accountNumber: true },
              },
            },
          },
          client: {
            select: {
              id: true,
              clientNumber: true,
              fullName: true,
            },
          },
        },
        orderBy: { calculatedAt: 'desc' },
        take: capLimit(filters?.limit),
        skip: filters?.offset ?? 0,
      }),
    );
  }
}

export const commissionService = new CommissionService();
