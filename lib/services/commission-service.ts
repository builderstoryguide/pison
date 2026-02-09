/**
 * Commission Service
 * Handles automatic commission calculation
 */

import { prisma } from '@/lib/prisma';
import { transactionService } from './transaction-service';

export interface CommissionCalculationResult {
  transactionId: string;
  clientId: string;
  amount: number;
  rate: number;
  commission: number;
}

export class CommissionService {
  /**
   * Get commission rate for a client
   */
  async getCommissionRate(clientId: string): Promise<number> {
    // Default commission rate (can be configured per client or system-wide)
    // For now, return a default rate of 2% (0.02)
    const DEFAULT_COMMISSION_RATE = 0.02;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // If client is commission exempt, return 0
    if (client.isCommissionExempt) {
      return 0;
    }

    // TODO: Implement per-client commission rate configuration
    return DEFAULT_COMMISSION_RATE;
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
  async calculateCommissionForTransaction(transactionId: string): Promise<CommissionCalculationResult | null> {
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

    // Calculate commission
    const commission = transaction.amount.toNumber() * rate;

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
  async calculateCommissions(period: string): Promise<CommissionCalculationResult[]> {
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
      include: {
        account: {
          include: {
            client: true,
          },
        },
      },
    });

    const results: CommissionCalculationResult[] = [];

    for (const transaction of transactions) {
      const result = await this.calculateCommissionForTransaction(transaction.id);
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

    const commissions = await prisma.$transaction(
      calculations.map((calc) =>
        prisma.commission.create({
          data: {
            transactionId: calc.transactionId,
            clientId: calc.clientId,
            amount: calc.commission,
            rate: calc.rate,
            calculationMethod: 'PERCENTAGE',
            period,
          },
        })
      )
    );

    // Create commission transactions (deduct from client accounts)
    for (const commission of commissions) {
      const transaction = await prisma.transaction.findUnique({
        where: { id: commission.transactionId },
        include: {
          account: {
            include: {
              client: true,
            },
          },
        },
      });

      if (transaction && transaction.account.client) {
        await transactionService.createTransaction(
          {
            accountId: transaction.accountId,
            type: 'COMMISSION',
            amount: commission.amount.toNumber(),
            description: `Commission for withdrawal transaction ${transaction.transactionNumber}`,
          },
          userId
        );
      }
    }

    return commissions;
  }

  /**
   * Get commissions for a period
   */
  async getCommissions(period?: string, clientId?: string) {
    const where: any = {};

    if (period) {
      where.period = period;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    return await prisma.commission.findMany({
      where,
      include: {
        transaction: {
          include: {
            account: true,
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
    });
  }
}

export const commissionService = new CommissionService();
