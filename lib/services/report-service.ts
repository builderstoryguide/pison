/**
 * Report Service
 * Generates reports for the microfinance system.
 * Keeps business logic on the server — API routes delegate to this service.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────────

export interface MonthlyBalanceRow {
  clientId: string;
  clientNumber: string;
  fullName: string;
  areaCode: string;
  areaName: string;
  openingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCollections: number;
  totalCommissions: number;
  closingBalance: number;
}

export interface CollectionJournalRow {
  transactionNumber: string;
  date: string;
  clientNumber: string;
  clientName: string;
  agentCode: string;
  agentName: string;
  areaCode: string;
  areaName: string;
  amount: number;
  status: string;
}

export interface ClientStatementRow {
  transactionNumber: string;
  date: string;
  type: string;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface AreaStatisticsRow {
  areaId: string;
  areaCode: string;
  areaName: string;
  clientCount: number;
  agentCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalCollections: number;
  transactionCount: number;
  netBalance: number;
}

export interface CommissionReportRow {
  commissionId: string;
  clientNumber: string;
  clientName: string;
  transactionNumber: string;
  withdrawalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  period: string;
  calculatedAt: string;
}

export interface SurplusShortageRow {
  date: string;
  totalCollections: number;
  totalDeposits: number;
  totalWithdrawals: number;
  systemBalance: number;
  physicalCash: number | null;
  surplusShortage: number;
  closedBy: string | null;
}

// ─── Service ────────────────────────────────────────────────────

export class ReportService {
  /**
   * Monthly Balance Report
   */
  async generateMonthlyBalance(params: {
    month: string; // YYYY-MM
    clientId?: string;
    areaId?: string;
  }): Promise<MonthlyBalanceRow[]> {
    const [year, monthNum] = params.month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Build client filter
    const clientWhere: Prisma.ClientWhereInput = { status: { not: 'CLOSED' } };
    if (params.clientId) clientWhere.id = params.clientId;
    if (params.areaId) clientWhere.areaId = params.areaId;

    const clients = await prisma.client.findMany({
      where: clientWhere,
      include: {
        account: true,
        area: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const rows: MonthlyBalanceRow[] = [];

    for (const client of clients) {
      // Transactions for this client's account within the period
      const txns = await prisma.transaction.findMany({
        where: {
          accountId: client.accountId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalCollections = 0;
      let totalCommissions = 0;

      for (const t of txns) {
        const amt = t.amount.toNumber();
        switch (t.type) {
          case 'DEPOSIT':
            totalDeposits += amt;
            break;
          case 'WITHDRAWAL':
            totalWithdrawals += amt;
            break;
          case 'COLLECTION':
            totalCollections += amt;
            break;
          case 'COMMISSION':
            totalCommissions += amt;
            break;
        }
      }

      // Opening balance = closing balance - net activity during period
      const closingBalance = client.account.balance.toNumber();
      const netActivity =
        totalDeposits + totalCollections - totalWithdrawals - totalCommissions;
      const openingBalance = closingBalance - netActivity;

      rows.push({
        clientId: client.id,
        clientNumber: client.clientNumber,
        fullName: client.fullName,
        areaCode: client.area.code,
        areaName: client.area.name,
        openingBalance,
        totalDeposits,
        totalWithdrawals,
        totalCollections,
        totalCommissions,
        closingBalance,
      });
    }

    return rows;
  }

  /**
   * Collection Journal
   */
  async generateCollectionJournal(params: {
    startDate: string;
    endDate: string;
    areaId?: string;
    agentId?: string;
  }): Promise<CollectionJournalRow[]> {
    const start = new Date(params.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);

    const where: Prisma.TransactionWhereInput = {
      type: 'COLLECTION',
      createdAt: { gte: start, lte: end },
    };
    if (params.areaId) where.areaId = params.areaId;
    if (params.agentId) where.agentId = params.agentId;

    const txns = await prisma.transaction.findMany({
      where,
      include: {
        account: { include: { client: true } },
        agent: true,
        area: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return txns.map((t) => ({
      transactionNumber: t.transactionNumber,
      date: t.createdAt.toISOString(),
      clientNumber: t.account.client?.clientNumber || '-',
      clientName: t.account.client?.fullName || '-',
      agentCode: t.agent?.agentCode || '-',
      agentName: t.agent?.fullName || '-',
      areaCode: t.area?.code || '-',
      areaName: t.area?.name || '-',
      amount: t.amount.toNumber(),
      status: t.status,
    }));
  }

  /**
   * Client Statement
   */
  async generateClientStatement(params: {
    clientId: string;
    startDate: string;
    endDate: string;
  }): Promise<{ client: any; rows: ClientStatementRow[] }> {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: { account: true, area: true },
    });

    if (!client) throw new Error('Client not found');

    const start = new Date(params.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);

    const txns = await prisma.transaction.findMany({
      where: {
        accountId: client.accountId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate opening balance from the first transaction in period
    let runningBalance = 0;
    if (txns.length > 0) {
      runningBalance = txns[0].balanceBefore.toNumber();
    } else {
      runningBalance = client.account.balance.toNumber();
    }

    const rows: ClientStatementRow[] = txns.map((t) => {
      const amt = t.amount.toNumber();
      const isCredit = ['DEPOSIT', 'COLLECTION', 'LOAN_REPAYMENT'].includes(t.type);
      const credit = isCredit ? amt : 0;
      const debit = isCredit ? 0 : amt;

      runningBalance = t.balanceAfter.toNumber();

      return {
        transactionNumber: t.transactionNumber,
        date: t.createdAt.toISOString(),
        type: t.type,
        description: t.description,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return {
      client: {
        id: client.id,
        clientNumber: client.clientNumber,
        fullName: client.fullName,
        accountNumber: client.account.accountNumber,
        currentBalance: client.account.balance.toNumber(),
        area: { code: client.area.code, name: client.area.name },
      },
      rows,
    };
  }

  /**
   * Statistics by Collection Area
   */
  async generateAreaStatistics(params: {
    startDate: string;
    endDate: string;
    areaId?: string;
  }): Promise<AreaStatisticsRow[]> {
    const start = new Date(params.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);

    const areaWhere: Prisma.CollectionAreaWhereInput = { status: 'ACTIVE' };
    if (params.areaId) areaWhere.id = params.areaId;

    const areas = await prisma.collectionArea.findMany({
      where: areaWhere,
      include: {
        _count: { select: { clients: true, agentAssignments: true } },
      },
      orderBy: { name: 'asc' },
    });

    const rows: AreaStatisticsRow[] = [];

    for (const area of areas) {
      const txns = await prisma.transaction.findMany({
        where: {
          areaId: area.id,
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
      });

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalCollections = 0;

      for (const t of txns) {
        const amt = t.amount.toNumber();
        switch (t.type) {
          case 'DEPOSIT':
            totalDeposits += amt;
            break;
          case 'WITHDRAWAL':
            totalWithdrawals += amt;
            break;
          case 'COLLECTION':
            totalCollections += amt;
            break;
        }
      }

      rows.push({
        areaId: area.id,
        areaCode: area.code,
        areaName: area.name,
        clientCount: area._count.clients,
        agentCount: area._count.agentAssignments,
        totalDeposits,
        totalWithdrawals,
        totalCollections,
        transactionCount: txns.length,
        netBalance: totalDeposits + totalCollections - totalWithdrawals,
      });
    }

    return rows;
  }

  /**
   * Commission Report
   */
  async generateCommissionReport(params: {
    period?: string;
    clientId?: string;
  }): Promise<CommissionReportRow[]> {
    const where: Prisma.CommissionWhereInput = {};
    if (params.period) where.period = params.period;
    if (params.clientId) where.clientId = params.clientId;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        client: { select: { clientNumber: true, fullName: true } },
        transaction: { select: { transactionNumber: true, amount: true } },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    return commissions.map((c) => ({
      commissionId: c.id,
      clientNumber: c.client.clientNumber,
      clientName: c.client.fullName,
      transactionNumber: c.transaction.transactionNumber,
      withdrawalAmount: c.transaction.amount.toNumber(),
      commissionRate: c.rate.toNumber(),
      commissionAmount: c.amount.toNumber(),
      period: c.period,
      calculatedAt: c.calculatedAt.toISOString(),
    }));
  }

  /**
   * Surplus / Shortage Report
   */
  async generateSurplusShortageReport(params: {
    startDate: string;
    endDate: string;
  }): Promise<SurplusShortageRow[]> {
    const start = new Date(params.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);

    const closures = await prisma.dailyClosure.findMany({
      where: {
        closureDate: { gte: start, lte: end },
      },
      include: {
        closer: { select: { name: true } },
      },
      orderBy: { closureDate: 'desc' },
    });

    return closures.map((c) => ({
      date: c.closureDate.toISOString(),
      totalCollections: c.totalCollections.toNumber(),
      totalDeposits: c.totalDeposits.toNumber(),
      totalWithdrawals: c.totalWithdrawals.toNumber(),
      systemBalance: c.systemBalance.toNumber(),
      physicalCash: c.physicalCash?.toNumber() ?? null,
      surplusShortage: c.surplusShortage.toNumber(),
      closedBy: c.closer?.name ?? null,
    }));
  }
}

export const reportService = new ReportService();
