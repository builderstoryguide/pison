/**
 * Report Service
 * Generates reports for the microfinance system.
 * Keeps business logic on the server — API routes delegate to this service.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { exportToCsv, exportToExcel, exportToPdf } from '@/lib/utils/export';
import {
  queryCacheKey,
  getCachedQuery,
  setCachedQuery,
} from '@/lib/cache/query-cache';

const REPORT_CACHE_TTL = 3600;

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
  totalLoanDisbursements: number;
  totalLoanRepayments: number;
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

export interface CommissionSummaryByClientRow {
  clientId: string;
  clientNumber: string;
  clientName: string;
  withdrawalCount: number;
  totalWithdrawalAmount: number;
  totalCommission: number;
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
    const cacheKey = queryCacheKey('report:monthly-balance', params);
    const cached = await getCachedQuery<MonthlyBalanceRow[]>(cacheKey);
    if (cached) return cached;

    const [year, monthNum] = params.month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Build client filter
    const clientWhere: Prisma.ClientWhereInput = { status: { not: 'CLOSED' } };
    if (params.clientId) clientWhere.id = params.clientId;
    if (params.areaId) clientWhere.areaId = params.areaId;

    const clients = await prisma.client.findMany({
      where: clientWhere,
      select: {
        id: true,
        clientNumber: true,
        fullName: true,
        accountId: true,
        account: { select: { balance: true } },
        area: { select: { code: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const accountIds = clients.map((c) => c.accountId);

    // Single query: fetch all transactions for all client accounts in the period
    const allTxns =
      accountIds.length > 0
        ? await prisma.transaction.findMany({
            where: {
              accountId: { in: accountIds },
              status: 'COMPLETED',
              createdAt: { gte: startDate, lte: endDate },
            },
            select: { accountId: true, type: true, amount: true },
          })
        : [];

    const txnsByAccount = new Map<string, typeof allTxns>();
    for (const t of allTxns) {
      const list = txnsByAccount.get(t.accountId) ?? [];
      list.push(t);
      txnsByAccount.set(t.accountId, list);
    }

    const rows: MonthlyBalanceRow[] = [];

    for (const client of clients) {
      const txns = txnsByAccount.get(client.accountId) ?? [];

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalCollections = 0;
      let totalCommissions = 0;
      let totalLoanDisbursements = 0;
      let totalLoanRepayments = 0;

      for (const t of txns) {
        const amt = t.amount.toNumber();
        switch (t.type) {
          case 'DEPOSIT':
            totalDeposits += amt;
            break;
          case 'WITHDRAWAL':
          case 'TRANSFER':
            totalWithdrawals += amt;
            break;
          case 'COLLECTION':
            totalCollections += amt;
            break;
          case 'COMMISSION':
            totalCommissions += amt;
            break;
          case 'LOAN_DISBURSEMENT':
            totalLoanDisbursements += amt;
            break;
          case 'LOAN_REPAYMENT':
            totalLoanRepayments += amt;
            break;
        }
      }

      // Opening balance = closing balance - net activity during period
      const closingBalance = client.account.balance.toNumber();
      // Net Activity = (Indices that increase balance) - (Indices that decrease balance)
      // Increases: DEPOSIT, COLLECTION, LOAN_DISBURSEMENT
      // Decreases: WITHDRAWAL, TRANSFER, LOAN_REPAYMENT, COMMISSION
      const netActivity =
        totalDeposits +
        totalCollections +
        totalLoanDisbursements -
        (totalWithdrawals + totalCommissions + totalLoanRepayments);
        
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
        totalLoanDisbursements,
        totalLoanRepayments,
        closingBalance,
      });
    }

    await setCachedQuery(cacheKey, rows, REPORT_CACHE_TTL);
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
    const cacheKey = queryCacheKey('report:collection-journal', params);
    const cached = await getCachedQuery<CollectionJournalRow[]>(cacheKey);
    if (cached) return cached;

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
      select: {
        transactionNumber: true,
        createdAt: true,
        amount: true,
        status: true,
        account: {
          select: {
            client: {
              select: { clientNumber: true, fullName: true },
            },
          },
        },
        agent: { select: { agentCode: true, fullName: true } },
        area: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = txns.map((t) => ({
      transactionNumber: t.transactionNumber,
      date: t.createdAt.toISOString(),
      clientNumber: t.account.client?.clientNumber ?? '-',
      clientName: t.account.client?.fullName ?? '-',
      agentCode: t.agent?.agentCode ?? '-',
      agentName: t.agent?.fullName ?? '-',
      areaCode: t.area?.code ?? '-',
      areaName: t.area?.name ?? '-',
      amount: t.amount.toNumber(),
      status: t.status,
    }));
    await setCachedQuery(cacheKey, rows, REPORT_CACHE_TTL);
    return rows;
  }

  /**
   * Client Statement
   */
  async generateClientStatement(params: {
    clientId: string;
    startDate: string;
    endDate: string;
  }): Promise<{ client: any; rows: ClientStatementRow[] }> {
    const cacheKey = queryCacheKey('report:client-statement', params);
    const cached = await getCachedQuery<{ client: any; rows: ClientStatementRow[] }>(cacheKey);
    if (cached) return cached;

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
      const isCredit = ['DEPOSIT', 'COLLECTION', 'LOAN_DISBURSEMENT'].includes(t.type);
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

    const result = {
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
    await setCachedQuery(cacheKey, result, REPORT_CACHE_TTL);
    return result;
  }

  /**
   * Statistics by Collection Area
   */
  async generateAreaStatistics(params: {
    startDate: string;
    endDate: string;
    areaId?: string;
  }): Promise<AreaStatisticsRow[]> {
    const cacheKey = queryCacheKey('report:area-stats', params);
    const cached = await getCachedQuery<AreaStatisticsRow[]>(cacheKey);
    if (cached) return cached;

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

    const areaIds = areas.map((a) => a.id);

    // Batch-fetch all transactions for all areas in one query (avoids N+1)
    const allTxns = areaIds.length > 0
      ? await prisma.transaction.findMany({
          where: {
            areaId: { in: areaIds },
            status: 'COMPLETED',
            createdAt: { gte: start, lte: end },
          },
          select: { areaId: true, type: true, amount: true },
        })
      : [];

    // Group transactions by areaId in memory
    const txnsByArea = new Map<string, typeof allTxns>();
    for (const t of allTxns) {
      if (!t.areaId) continue;
      const arr = txnsByArea.get(t.areaId);
      if (arr) arr.push(t);
      else txnsByArea.set(t.areaId, [t]);
    }

    const rows: AreaStatisticsRow[] = [];

    for (const area of areas) {
      const txns = txnsByArea.get(area.id) ?? [];

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
          case 'TRANSFER':
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

    await setCachedQuery(cacheKey, rows, REPORT_CACHE_TTL);
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
   * Commission Summary by Client (aggregated)
   */
  async generateCommissionSummaryByClient(params: {
    period?: string;
    clientId?: string;
  }): Promise<CommissionSummaryByClientRow[]> {
    const where: Prisma.CommissionWhereInput = {};
    if (params.period) where.period = params.period;
    if (params.clientId) where.clientId = params.clientId;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        client: { select: { id: true, clientNumber: true, fullName: true } },
        transaction: { select: { amount: true } },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    const byClient = new Map<
      string,
      { clientNumber: string; clientName: string; withdrawalCount: number; totalWithdrawal: number; totalCommission: number }
    >();
    for (const c of commissions) {
      const key = c.client.id;
      const withdrawalAmt = c.transaction.amount.toNumber();
      const commissionAmt = c.amount.toNumber();
      const existing = byClient.get(key);
      if (existing) {
        existing.withdrawalCount += 1;
        existing.totalWithdrawal += withdrawalAmt;
        existing.totalCommission += commissionAmt;
      } else {
        byClient.set(key, {
          clientNumber: c.client.clientNumber,
          clientName: c.client.fullName,
          withdrawalCount: 1,
          totalWithdrawal: withdrawalAmt,
          totalCommission: commissionAmt,
        });
      }
    }

    return Array.from(byClient.entries()).map(([clientId, agg]) => ({
      clientId,
      clientNumber: agg.clientNumber,
      clientName: agg.clientName,
      withdrawalCount: agg.withdrawalCount,
      totalWithdrawalAmount: agg.totalWithdrawal,
      totalCommission: agg.totalCommission,
    }));
  }

  /**
   * Surplus / Shortage Report
   */
  async generateSurplusShortageReport(params: {
    startDate: string;
    endDate: string;
  }): Promise<SurplusShortageRow[]> {
    const cacheKey = queryCacheKey('report:surplus-shortage', params);
    const cached = await getCachedQuery<SurplusShortageRow[]>(cacheKey);
    if (cached) return cached;

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

    const rows = closures.map((c) => ({
      date: c.closureDate.toISOString(),
      totalCollections: c.totalCollections.toNumber(),
      totalDeposits: c.totalDeposits.toNumber(),
      totalWithdrawals: c.totalWithdrawals.toNumber(),
      systemBalance: c.systemBalance.toNumber(),
      physicalCash: c.physicalCash?.toNumber() ?? null,
      surplusShortage: c.surplusShortage.toNumber(),
      closedBy: c.closer?.name ?? null,
    }));
    await setCachedQuery(cacheKey, rows, REPORT_CACHE_TTL);
    return rows;
  }
  /**
   * Export report data to buffer
   */
  async exportReport(
    data: any[],
    format: 'csv' | 'excel' | 'pdf',
    filename: string = 'report'
  ): Promise<Buffer> {
    if (format === 'csv') {
      return await exportToCsv(data);
    }
    if (format === 'pdf') {
      return await exportToPdf(data, filename);
    }
    return await exportToExcel(data, filename);
  }
}

export const reportService = new ReportService();
