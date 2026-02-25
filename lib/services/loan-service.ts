/**
 * Loan Service
 * Handles all business logic for loans
 */

import { prisma } from '@/lib/prisma';
import { LoanStatus, Prisma } from '@prisma/client';
import { sessionService } from './session-service';
import { getCachedCount } from '@/lib/cache';
import { getCachedOrFetch, getCachedOrFetchByKey } from '@/lib/cache/query-cache';
import { LIST_PREFIX_LOANS, loanDetailKey } from '@/lib/cache/keys';
import {
  capLimit,
  decodeCursor,
  encodeCursor,
  buildCountCacheKey,
} from '@/lib/utils/pagination';
import { transactionService } from './transaction-service';
import {
  invalidateBalanceForAccount,
  invalidateRecentTransactionsForAccount,
  invalidateAdminRecentTransactions,
  invalidateLoansForClient,
  invalidateLoanDetail,
  invalidateLoanRepayments,
  invalidateDashboardStats,
  invalidateCountCacheForEntity,
  invalidateLoanListCache,
  invalidateAll,
} from '@/lib/cache';

const LOAN_LIST_TTL = 30;
const LOAN_DETAIL_TTL = 60;

export interface CreateLoanInput {
  accountId: string;
  clientId: string;
  principalAmount: number;
  interestRate: number;
  purpose?: string;
  maturityDate?: Date;
  loanProductId?: string;
}

export interface LoanEligibilityResult {
  eligible: boolean;
  reason?: string;
  existingLoan?: {
    id: string;
    remainingBalance: number;
  };
}

export class LoanService {
  /**
   * Generate unique loan number
   */
  private async generateLoanNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const loanNumber = `LON-${dateStr}-${random}`;

    const exists = await prisma.loan.findUnique({
      where: { loanNumber },
    });

    if (exists) {
      return this.generateLoanNumber();
    }

    return loanNumber;
  }

  /**
   * Check if client is eligible for a loan
   */
  async checkEligibility(clientId: string): Promise<LoanEligibilityResult> {
    // Check for existing active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        clientId,
        status: {
          in: ['APPROVED', 'DISBURSED', 'ACTIVE'],
        },
      },
    });

    if (activeLoan) {
      return {
        eligible: false,
        reason: 'Client has an active loan',
        existingLoan: {
          id: activeLoan.id,
          remainingBalance: activeLoan.remainingBalance.toNumber(),
        },
      };
    }

    // Check client status
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return {
        eligible: false,
        reason: 'Client not found',
      };
    }

    if (client.status !== 'ACTIVE') {
      return {
        eligible: false,
        reason: `Client account is ${client.status.toLowerCase()}`,
      };
    }

    if (client.approvalStatus !== 'APPROVED') {
      return {
        eligible: false,
        reason: 'Client account must be approved by manager before loan',
      };
    }

    return {
      eligible: true,
    };
  }

  /**
   * Calculate interest amount
   */
  calculateInterest(principal: number, rate: number, termMonths: number): number {
    // Simple interest calculation: Principal * Rate * Time
    return principal * rate * (termMonths / 12);
  }

  /**
   * Create a loan request
   */
  async createLoanRequest(data: CreateLoanInput, createdBy: string) {
    // Check session is open (PRD: no operations when session closed)
    const sessionOpen = await sessionService.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. No operations allowed.');
    }

    // Check eligibility
    const eligibility = await this.checkEligibility(data.clientId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Client is not eligible for a loan');
    }

    // Validate account
    const account = await prisma.financialAccount.findUnique({
      where: { id: data.accountId },
      include: { accountNature: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.accountType !== 'CLIENT') {
      throw new Error('Loan can only be created for client accounts');
    }

    // Validate amounts
    if (data.principalAmount <= 0) {
      throw new Error('Principal amount must be positive');
    }

    if (data.interestRate < 0 || data.interestRate > 1) {
      throw new Error('Interest rate must be between 0 and 1 (0% to 100%)');
    }

    const maturityDate = data.maturityDate ? new Date(data.maturityDate) : new Date();
    let termMonths = 12;
    let interestRate = data.interestRate;

    // Green Credit (or other loan product) validation
    if (data.loanProductId) {
      const product = await prisma.loanProduct.findUnique({
        where: { id: data.loanProductId, isActive: true },
      });
      if (!product) {
        throw new Error('Loan product not found or not active');
      }
      if (data.principalAmount > product.maxAmount.toNumber()) {
        throw new Error(
          `Principal exceeds maximum allowed (${product.maxAmount.toNumber()} CFA) for this product`
        );
      }
      interestRate = product.interestRate.toNumber();
      termMonths = Math.ceil(product.maxDurationDays / 30);
      maturityDate.setDate(maturityDate.getDate() + product.maxDurationDays);

      // Green Credit: require client has Daily Collection account with 1+ month history
      if (product.code === 'GREEN_CREDIT' && product.minDailyCollectionMonths) {
        const client = await prisma.client.findUnique({
          where: { id: data.clientId },
          include: { account: { include: { accountNature: true } } },
        });
        if (!client?.account?.accountNature) {
          throw new Error('Green Credit requires client to have a Daily Collection account');
        }
        if (client.account.accountNature.code !== 'DAILY_COLLECTION') {
          throw new Error('Green Credit requires client to have a Daily Collection account');
        }
        const accountAge = client.account.openedAt;
        const monthsSince = (Date.now() - accountAge.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSince < product.minDailyCollectionMonths) {
          throw new Error(
            `Client must have Daily Collection account for at least ${product.minDailyCollectionMonths} month(s)`
          );
        }
      }
    } else {
      maturityDate.setMonth(maturityDate.getMonth() + 12);
    }

    const interestAmount = this.calculateInterest(
      data.principalAmount,
      interestRate,
      termMonths
    );
    const totalAmount = data.principalAmount + interestAmount;

    const loanNumber = await this.generateLoanNumber();

    const loan = await prisma.loan.create({
      data: {
        loanNumber,
        accountId: data.accountId,
        clientId: data.clientId,
        principalAmount: data.principalAmount,
        interestRate,
        totalAmount,
        remainingBalance: totalAmount,
        status: 'PENDING',
        loanProductId: data.loanProductId ?? null,
        purpose: data.purpose,
        maturityDate,
        createdBy,
      },
      include: {
        account: true,
        client: {
          include: {
            area: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE',
        entityType: 'LOAN',
        entityId: loan.id,
        description: `Loan request created: ${loanNumber} - ${data.principalAmount} for client`,
      },
    });

    await invalidateAll(
      invalidateLoansForClient(data.clientId),
      invalidateCountCacheForEntity('loans'),
      invalidateLoanListCache(),
      invalidateDashboardStats(),
    );
    return loan;
  }

  /**
   * Approve and disburse a loan
   * Creates LOAN_DISBURSEMENT transaction and auto-approves it so the account balance updates immediately
   */
  async approveLoan(loanId: string, approverId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        account: true,
        client: true,
      },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'PENDING') {
      throw new Error(`Loan is not pending approval. Current status: ${loan.status}`);
    }

    const disbursementRef = `loan-disbursement-${loanId}`;

    const updatedLoan = await prisma.$transaction(async (tx) => {
      // Idempotency: check for existing disbursement (inside tx to avoid race)
      const existingTxn = await tx.transaction.findFirst({
        where: { reference: disbursementRef },
      });

      if (existingTxn) {
        if (existingTxn.status === 'PENDING_APPROVAL') {
          await transactionService.approveTransaction(existingTxn.id, approverId, undefined, tx);
        }
        // If already approved/completed by another process, skip re-approval and proceed to loan update
      } else {
        const disbursementTxn = await transactionService.createTransaction(
          {
            accountId: loan.accountId,
            type: 'LOAN_DISBURSEMENT',
            amount: loan.principalAmount.toNumber(),
            description: `Loan disbursement: ${loan.loanNumber}`,
            reference: disbursementRef,
          },
          approverId,
          tx
        );
        await transactionService.approveTransaction(disbursementTxn.id, approverId, undefined, tx);
      }

      // Update loan status to APPROVED and DISBURSED
      return await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'DISBURSED',
          approvedBy: approverId,
          approvedAt: new Date(),
          disbursedAt: new Date(),
        },
        include: {
          account: true,
          client: true,
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: approverId,
        action: 'APPROVE',
        entityType: 'LOAN',
        entityId: loanId,
        description: `Loan approved and disbursed: ${loan.loanNumber}`,
      },
    });

    await invalidateAll(
      invalidateBalanceForAccount(loan.accountId),
      invalidateRecentTransactionsForAccount(loan.accountId),
      invalidateAdminRecentTransactions(),
      invalidateLoansForClient(loan.clientId),
      invalidateLoanDetail(loanId),
      invalidateCountCacheForEntity('loans'),
      invalidateLoanListCache(),
      invalidateDashboardStats(),
    );

    return updatedLoan;
  }

  /**
   * Reject a pending loan request
   */
  async rejectLoan(loanId: string, rejectorId: string, reason?: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'PENDING') {
      throw new Error(`Loan is not pending. Current status: ${loan.status}`);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'CANCELLED',
        approvedBy: rejectorId,
        approvedAt: new Date(),
      },
      include: {
        account: true,
        client: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: rejectorId,
        action: 'REJECT',
        entityType: 'LOAN',
        entityId: loanId,
        description: reason
          ? `Loan rejected: ${loan.loanNumber} - ${reason}`
          : `Loan rejected: ${loan.loanNumber}`,
      },
    });

    await invalidateAll(
      invalidateLoansForClient(loan.clientId),
      invalidateLoanDetail(loanId),
      invalidateCountCacheForEntity('loans'),
      invalidateLoanListCache(),
      invalidateDashboardStats(),
    );

    return updatedLoan;
  }

  /**
   * Record a loan repayment
   * Creates LOAN_REPAYMENT transaction and auto-approves it so the account balance updates immediately
   */
  async recordRepayment(loanId: string, amount: number, userId: string) {
    if (amount <= 0) {
      throw new Error('Repayment amount must be positive');
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        account: true,
        repayments: true,
      },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (!['DISBURSED', 'ACTIVE'].includes(loan.status)) {
      throw new Error('Loan is not active');
    }

    if (amount > loan.remainingBalance.toNumber()) {
      throw new Error('Repayment amount exceeds remaining balance');
    }

    // Create repayment transaction
    const transaction = await transactionService.createTransaction(
      {
        accountId: loan.accountId,
        type: 'LOAN_REPAYMENT',
        amount,
        description: `Loan repayment for ${loan.loanNumber}`,
        reference: `loan-repayment-${loanId}-${Date.now()}`,
      },
      userId
    );

    // Auto-approve: recording repayment implies approval (user has loans.repayment)
    await transactionService.approveTransaction(transaction.id, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Calculate principal vs interest: pay interest first, then principal
      // Use remaining unpaid interest, not total interest (avoid reallocating already-paid interest)
      const totalInterest = loan.totalAmount.toNumber() - loan.principalAmount.toNumber();
      const paidInterest = loan.repayments.reduce((sum, r) => sum + Number(r.interest), 0);
      const remainingInterest = Math.max(0, totalInterest - paidInterest);
      const interestPortion = Math.min(amount, remainingInterest);
      const principalPortion = amount - interestPortion;

      // Create repayment record
      const repayment = await tx.loanRepayment.create({
        data: {
          loanId,
          transactionId: transaction.id,
          amount,
          principal: principalPortion,
          interest: interestPortion,
        },
      });

      // Update loan remaining balance
      const newRemainingBalance = loan.remainingBalance.toNumber() - amount;
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance === 0 ? 'PAID_OFF' : 'ACTIVE',
        },
      });

      return {
        loan: updatedLoan,
        repayment,
      };
    });

    await invalidateAll(
      invalidateLoanDetail(loanId),
      invalidateLoanRepayments(loanId),
      invalidateLoansForClient(loan.clientId),
      invalidateCountCacheForEntity('loans'),
      invalidateLoanListCache(),
      invalidateDashboardStats(),
    );

    return result;
  }

  /**
   * Update a loan request
   */
  async updateLoan(id: string, data: Partial<CreateLoanInput>, userId?: string) {
    const loan = await prisma.loan.findUnique({ where: { id } });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'PENDING') {
      throw new Error('Only pending loans can be updated');
    }

    let totalAmount = Number(loan.totalAmount);
    let remainingBalance = Number(loan.remainingBalance);
    const principalAmount = data.principalAmount ?? Number(loan.principalAmount);
    const interestRate = data.interestRate ?? Number(loan.interestRate);
    
    // Recalculate if financial terms change
    if (data.principalAmount || data.interestRate || data.maturityDate) {
      // Calculate term in months
      const startDate = new Date();
      
      let maturityDate = data.maturityDate;
      if (!maturityDate) {
        if (loan.maturityDate) {
          maturityDate = new Date(loan.maturityDate);
        } else {
          maturityDate = new Date();
          maturityDate.setFullYear(maturityDate.getFullYear() + 1);
        }
      }
      
      const diffTime = Math.abs(maturityDate.getTime() - startDate.getTime());
      const termMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); 
      
      const interestAmount = this.calculateInterest(
        principalAmount,
        interestRate,
        termMonths || 12 // fallback
      );
      
      totalAmount = principalAmount + interestAmount;
      remainingBalance = totalAmount;
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        principalAmount,
        interestRate,
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.maturityDate !== undefined && { maturityDate: data.maturityDate }),
        totalAmount,
        remainingBalance,
      },
      include: {
        account: true,
        client: {
          include: {
            area: true,
          },
        },
      },
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'LOAN',
          entityId: id,
          description: `Loan request updated: ${updated.loanNumber}`,
        },
      });
    }

    await invalidateAll(
      invalidateCountCacheForEntity('loans'),
      invalidateLoanListCache(),
      invalidateLoanDetail(id),
    );
    return updated;
  }

  /**
   * Get all loans with filters and pagination
   * Supports offset-based (default) and cursor-based pagination.
   */
  async getAllLoans(filters?: {
    status?: string;
    statusIn?: string[];
    clientId?: string;
    accountId?: string;
    areaIds?: string[];
    search?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    cursor?: string;
    select?: Prisma.LoanSelect;
  }) {
    const where: Prisma.LoanWhereInput = {};

    if (filters?.statusIn && filters.statusIn.length > 0) {
      where.status = { in: filters.statusIn as LoanStatus[] };
    } else if (filters?.status) {
      where.status = filters.status as LoanStatus;
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters?.areaIds && filters.areaIds.length > 0) {
      where.client = {
        areaId: {
          in: filters.areaIds,
        },
      };
    }
    if (filters?.search) {
      where.OR = [
        { loanNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { fullName: { contains: filters.search, mode: 'insensitive' } },
              { clientNumber: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const useCursor = !!filters?.cursor;
    const decodedCursor = useCursor ? decodeCursor(filters.cursor!) : null;

    let finalWhere: Prisma.LoanWhereInput = where;
    if (useCursor && decodedCursor) {
      finalWhere = {
        AND: [
          where,
          {
            OR: [
              { createdAt: { lt: decodedCursor.createdAt } },
              {
                createdAt: decodedCursor.createdAt,
                id: { lt: decodedCursor.id },
              },
            ],
          },
        ],
      };
    }

    const limit = capLimit(filters?.limit);
    const countCacheKey = buildCountCacheKey('loans', {
      status: filters?.status,
      statusIn: filters?.statusIn?.slice().sort(),
      clientId: filters?.clientId,
      accountId: filters?.accountId,
      areaIds: filters?.areaIds?.slice().sort(),
      search: filters?.search,
    });

    const defaultSelect: Prisma.LoanSelect = {
      id: true,
      loanNumber: true,
      principalAmount: true,
      totalAmount: true,
      remainingBalance: true,
      status: true,
      maturityDate: true,
      disbursedAt: true,
      createdAt: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          balance: true,
          status: true,
        },
      },
      client: {
        select: {
          id: true,
          clientNumber: true,
          fullName: true,
          area: {
            select: { id: true, code: true, name: true },
          },
        },
      },
      creator: { select: { name: true } },
      approver: { select: { name: true } },
    };

    const LOAN_SORT_FIELDS = ['loanNumber', 'createdAt', 'principalAmount', 'status', 'disbursedAt'];
    const sortField = filters?.sort && LOAN_SORT_FIELDS.includes(filters.sort) ? filters.sort : 'createdAt';
    const sortDir = filters?.dir === 'asc' ? 'asc' : 'desc';
    const orderBy = useCursor ? { createdAt: 'desc' as const } : { [sortField]: sortDir };

    const cacheParams = {
      status: filters?.status,
      statusIn: filters?.statusIn?.slice().sort(),
      clientId: filters?.clientId,
      accountId: filters?.accountId,
      areaIds: filters?.areaIds?.slice().sort(),
      search: filters?.search,
      sort: sortField,
      dir: sortDir,
      limit,
      offset: useCursor ? 0 : (filters?.offset ?? 0),
      cursor: filters?.cursor,
      hasSelect: !!filters?.select,
    };

    const result = await getCachedOrFetch(LIST_PREFIX_LOANS, cacheParams, LOAN_LIST_TTL, async () => {
      const [rows, count] = await Promise.all([
        prisma.loan.findMany({
          where: finalWhere,
          select: filters?.select
            ? { ...filters.select, id: true, createdAt: true }
            : defaultSelect,
          orderBy,
          take: limit,
          skip: useCursor ? 0 : (filters?.offset ?? 0),
        }),
        getCachedCount(countCacheKey, () => prisma.loan.count({ where })),
      ]);
      return { rows, count };
    });

    const loans = result.rows;
    const total = result.count;

    const last = loans[loans.length - 1];
    const nextCursor =
      useCursor && last && loans.length === limit
        ? encodeCursor(last.createdAt, last.id)
        : null;

    return {
      loans,
      total,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: string) {
    return getCachedOrFetchByKey(loanDetailKey(id), LOAN_DETAIL_TTL, () =>
      prisma.loan.findUnique({
        where: { id },
        include: {
          account: true,
          client: {
            include: {
              area: true,
              account: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          repayments: {
            include: {
              transaction: true,
            },
            orderBy: { repaidAt: 'desc' },
          },
        },
      }),
    );
  }
}

export const loanService = new LoanService();
