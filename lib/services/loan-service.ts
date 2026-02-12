/**
 * Loan Service
 * Handles all business logic for loans
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { transactionService } from './transaction-service';

export interface CreateLoanInput {
  accountId: string;
  clientId: string;
  principalAmount: number;
  interestRate: number;
  purpose?: string;
  maturityDate?: Date;
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
    // Check eligibility
    const eligibility = await this.checkEligibility(data.clientId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Client is not eligible for a loan');
    }

    // Validate account
    const account = await prisma.financialAccount.findUnique({
      where: { id: data.accountId },
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

    // Calculate total amount (principal + interest)
    // For now, assume 12 months term if maturity date not provided
    const maturityDate = data.maturityDate || new Date();
    maturityDate.setMonth(maturityDate.getMonth() + 12);

    const termMonths = 12; // Default to 12 months
    const interestAmount = this.calculateInterest(
      data.principalAmount,
      data.interestRate,
      termMonths
    );
    const totalAmount = data.principalAmount + interestAmount;

    const loanNumber = await this.generateLoanNumber();

    return await prisma.loan.create({
      data: {
        loanNumber,
        accountId: data.accountId,
        clientId: data.clientId,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        totalAmount,
        remainingBalance: totalAmount,
        status: 'PENDING',
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
  }

  /**
   * Approve and disburse a loan
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

    return await prisma.$transaction(async (tx) => {
      // Update loan status
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date(),
        },
      });

      // Disburse loan (create negative transaction)
      await transactionService.createTransaction(
        {
          accountId: loan.accountId,
          type: 'LOAN_DISBURSEMENT',
          amount: loan.principalAmount,
          description: `Loan disbursement: ${loan.loanNumber}`,
        },
        approverId
      );

      // Update loan to DISBURSED
      await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'DISBURSED',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: approverId,
          action: 'APPROVE',
          entityType: 'LOAN',
          entityId: loanId,
          description: `Loan approved and disbursed: ${loan.loanNumber}`,
        },
      });

      return await tx.loan.findUnique({
        where: { id: loanId },
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
  }

  /**
   * Record a loan repayment
   */
  async recordRepayment(loanId: string, amount: number, userId: string) {
    if (amount <= 0) {
      throw new Error('Repayment amount must be positive');
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        account: true,
      },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (!['DISBURSED', 'ACTIVE'].includes(loan.status)) {
      throw new Error('Loan is not active');
    }

    if (amount > loan.remainingBalance) {
      throw new Error('Repayment amount exceeds remaining balance');
    }

    return await prisma.$transaction(async (tx) => {
      // Create repayment transaction
      const transaction = await transactionService.createTransaction(
        {
          accountId: loan.accountId,
          type: 'LOAN_REPAYMENT',
          amount,
          description: `Loan repayment for ${loan.loanNumber}`,
        },
        userId
      );

      // Calculate principal vs interest
      // Simple approach: pay interest first, then principal
      const interestPortion = Math.min(amount, loan.totalAmount - loan.principalAmount);
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
      const newRemainingBalance = loan.remainingBalance - amount;
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
  }

  /**
   * Update a loan request
   */
  async updateLoan(id: string, data: Partial<CreateLoanInput>, userId: string) {
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

    return await prisma.loan.update({
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
  }

  /**
   * Get all loans with filters
   */
  async getAllLoans(filters?: {
    status?: string;
    clientId?: string;
    accountId?: string;
  }) {
    const where: Prisma.LoanWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as any;
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }

    return await prisma.loan.findMany({
      where,
      include: {
        account: true,
        client: {
          include: {
            area: true,
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
        approver: {
          select: {
            name: true,
          },
        },
        repayments: {
          orderBy: { repaidAt: 'desc' },
        },
        _count: {
          select: {
            repayments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: string) {
    return await prisma.loan.findUnique({
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
    });
  }
}

export const loanService = new LoanService();
