/**
 * Transaction Service
 * Handles all business logic for financial transactions
 * Implements four-eye principle for transaction approval
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateTransactionInput {
  accountId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COLLECTION' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'TRANSFER' | 'COMMISSION' | 'ADJUSTMENT';
  amount: number;
  description?: string;
  reference?: string;
  areaId?: string;
  agentId?: string;
}

export interface CreateCollectionInput {
  areaId: string;
  agentId: string;
  entries: Array<{
    clientId: string;
    amount: number;
    description?: string;
  }>;
}

export interface CreateTransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
}

export class TransactionService {
  /**
   * Generate unique transaction number
   * @param tx - Optional Prisma transaction client for use within $transaction callbacks
   */
  private async generateTransactionNumber(tx?: Prisma.TransactionClient): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const transactionNumber = `TXN-${dateStr}-${random}`;

    const client = tx ?? prisma;
    const exists = await client.transaction.findUnique({
      where: { transactionNumber },
    });

    if (exists) {
      return this.generateTransactionNumber(tx);
    }

    return transactionNumber;
  }

  /**
   * Check if session is open
   */
  private async isSessionOpen(): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session = await prisma.dailySession.findUnique({
      where: {
        sessionDate: today,
      },
    });

    return session?.status === 'OPEN' || false;
  }

  /**
   * Create a single transaction (pending approval)
   */
  async createTransaction(data: CreateTransactionInput, createdBy: string) {
    // Check session is open
    const sessionOpen = await this.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. No transactions allowed.');
    }

    // Validate account exists and is active
    const account = await prisma.financialAccount.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // For withdrawals, check available balance (use .toNumber() for consistent Decimal comparison)
    if (data.type === 'WITHDRAWAL' || data.type === 'TRANSFER') {
      if (account.availableBalance.toNumber() < data.amount) {
        throw new Error('Insufficient available balance');
      }
    }

    // Calculate balance after
    let balanceAfter = account.balance;
    if (data.type === 'DEPOSIT' || data.type === 'COLLECTION' || data.type === 'LOAN_REPAYMENT') {
      balanceAfter = account.balance + data.amount;
    } else if (data.type === 'WITHDRAWAL' || data.type === 'LOAN_DISBURSEMENT' || data.type === 'TRANSFER') {
      balanceAfter = account.balance - data.amount;
    }
    // COMMISSION and ADJUSTMENT handled separately

    const transactionNumber = await this.generateTransactionNumber();

    return await prisma.transaction.create({
      data: {
        transactionNumber,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        balanceBefore: account.balance,
        balanceAfter,
        status: 'PENDING_APPROVAL',
        description: data.description,
        reference: data.reference,
        areaId: data.areaId,
        agentId: data.agentId,
        createdBy,
      },
      include: {
        account: true,
        area: true,
        agent: true,
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
   * Create collection entries (ventilation) - multiple transactions at once
   */
  async createCollectionEntries(data: CreateCollectionInput, createdBy: string) {
    // Validate agent has access to area
    const agentService = (await import('./agent-service')).agentService;
    const hasAccess = await agentService.validateAgentAreaAccess(data.agentId, data.areaId);

    if (!hasAccess) {
      throw new Error('Agent does not have access to this collection area');
    }

    // Check session is open
    const sessionOpen = await this.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. No transactions allowed.');
    }

    // Validate all clients belong to the area
    const clients = await prisma.client.findMany({
      where: {
        id: {
          in: data.entries.map((e) => e.clientId),
        },
        areaId: data.areaId,
        status: 'ACTIVE',
      },
      include: {
        account: true,
      },
    });

    if (clients.length !== data.entries.length) {
      throw new Error('Some clients not found or do not belong to this area');
    }

    // Create transactions for each entry
    const transactions = await Promise.all(
      data.entries.map(async (entry) => {
        const client = clients.find((c) => c.id === entry.clientId);
        if (!client) {
          throw new Error(`Client ${entry.clientId} not found`);
        }

        const transactionNumber = await this.generateTransactionNumber();
        const balanceAfter = client.account.balance + entry.amount;

        return await prisma.transaction.create({
          data: {
            transactionNumber,
            accountId: client.accountId,
            type: 'COLLECTION',
            amount: entry.amount,
            balanceBefore: client.account.balance,
            balanceAfter,
            status: 'PENDING_APPROVAL',
            description: entry.description || `Collection from area ${data.areaId}`,
            areaId: data.areaId,
            agentId: data.agentId,
            createdBy,
          },
        });
      })
    );

    return transactions;
  }

  /**
   * Create a transfer (dual-entry: debit source, credit destination)
   * Both transactions are linked via reference and require approval together
   */
  async createTransfer(data: CreateTransferInput, createdBy: string) {
    const sessionOpen = await this.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. No transactions allowed.');
    }

    if (data.sourceAccountId === data.destinationAccountId) {
      throw new Error('Source and destination accounts must be different');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const [sourceAccount, destAccount] = await Promise.all([
      prisma.financialAccount.findUnique({ where: { id: data.sourceAccountId } }),
      prisma.financialAccount.findUnique({ where: { id: data.destinationAccountId } }),
    ]);

    if (!sourceAccount) throw new Error('Source account not found');
    if (!destAccount) throw new Error('Destination account not found');
    if (sourceAccount.status !== 'ACTIVE') throw new Error('Source account is not active');
    if (destAccount.status !== 'ACTIVE') throw new Error('Destination account is not active');

    if (sourceAccount.availableBalance.toNumber() < data.amount) {
      throw new Error('Insufficient available balance in source account');
    }

    const transferRef = `transfer-${crypto.randomUUID()}`;

    return await prisma.$transaction(async (tx) => {
      const sourceTxnNumber = await this.generateTransactionNumber(tx);
      const destTxnNumber = await this.generateTransactionNumber(tx);

      const sourceBalanceAfter = sourceAccount.balance.toNumber() - data.amount;
      const destBalanceAfter = destAccount.balance.toNumber() + data.amount;

      const [sourceTxn, destTxn] = await Promise.all([
        tx.transaction.create({
          data: {
            transactionNumber: sourceTxnNumber,
            accountId: data.sourceAccountId,
            type: 'TRANSFER',
            amount: data.amount,
            balanceBefore: sourceAccount.balance,
            balanceAfter: sourceBalanceAfter,
            status: 'PENDING_APPROVAL',
            description: data.description || `Transfer to ${destAccount.accountNumber}`,
            reference: transferRef,
            createdBy,
          },
          include: {
            account: { include: { client: true, agent: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
        }),
        tx.transaction.create({
          data: {
            transactionNumber: destTxnNumber,
            accountId: data.destinationAccountId,
            type: 'DEPOSIT',
            amount: data.amount,
            balanceBefore: destAccount.balance,
            balanceAfter: destBalanceAfter,
            status: 'PENDING_APPROVAL',
            description: data.description || `Transfer from ${sourceAccount.accountNumber}`,
            reference: transferRef,
            createdBy,
          },
          include: {
            account: { include: { client: true, agent: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
        }),
      ]);

      return { sourceTransaction: sourceTxn, destinationTransaction: destTxn };
    });
  }

  /**
   * Approve a transaction (four-eye principle)
   * For transfers, approves both linked transactions together
   */
  async approveTransaction(transactionId: string, approverId: string, notes?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING_APPROVAL') {
      throw new Error(`Transaction is not pending approval. Current status: ${transaction.status}`);
    }

    // Check session is still open
    const sessionOpen = await this.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. Cannot approve transactions.');
    }

    // For transfers, find the paired transaction
    const isTransfer = transaction.reference?.startsWith('transfer-');
    const pairedTransaction = isTransfer
      ? await prisma.transaction.findFirst({
          where: {
            reference: transaction.reference,
            id: { not: transactionId },
            status: 'PENDING_APPROVAL',
          },
          include: { account: true },
        })
      : null;

    return await prisma.$transaction(async (tx) => {
      const transactionsToApprove = pairedTransaction
        ? [transaction, pairedTransaction]
        : [transaction];

      for (const txn of transactionsToApprove) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        const isCredit =
          txn.type === 'DEPOSIT' || txn.type === 'COLLECTION' || txn.type === 'LOAN_REPAYMENT';
        await tx.financialAccount.update({
          where: { id: txn.accountId },
          data: {
            balance: txn.balanceAfter,
            availableBalance: isCredit
              ? txn.account.availableBalance.toNumber() + txn.amount.toNumber()
              : txn.account.availableBalance.toNumber() - txn.amount.toNumber(),
          },
        });

        await tx.transaction.update({
          where: { id: txn.id },
          data: { status: 'COMPLETED' },
        });

        await tx.auditLog.create({
          data: {
            userId: approverId,
            action: 'APPROVE',
            entityType: 'TRANSACTION',
            entityId: txn.id,
            transactionId: txn.id,
            description: `Transaction approved${notes ? `: ${notes}` : ''}`,
          },
        });
      }

      return await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          account: true,
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
   * Reject a transaction
   */
  async rejectTransaction(transactionId: string, approverId: string, reason: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING_APPROVAL') {
      throw new Error(`Transaction is not pending approval. Current status: ${transaction.status}`);
    }

    const isTransfer = transaction.reference?.startsWith('transfer-');
    const pairedTransaction = isTransfer
      ? await prisma.transaction.findFirst({
          where: {
            reference: transaction.reference,
            id: { not: transactionId },
            status: 'PENDING_APPROVAL',
          },
        })
      : null;

    return await prisma.$transaction(async (tx) => {
      const transactionsToReject = pairedTransaction
        ? [transaction, pairedTransaction]
        : [transaction];

      for (const txn of transactionsToReject) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: {
            status: 'REJECTED',
            approvedBy: approverId,
            approvedAt: new Date(),
            rejectedReason: reason,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: approverId,
            action: 'REJECT',
            entityType: 'TRANSACTION',
            entityId: txn.id,
            transactionId: txn.id,
            description: `Transaction rejected: ${reason}`,
          },
        });
      }

      return await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { account: true },
      });
    });
  }

  /**
   * Get transactions with optional filters (for list view)
   */
  async getTransactions(filters?: {
    type?: string;
    status?: string;
    accountId?: string;
    areaId?: string;
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.TransactionWhereInput = {};

    if (filters?.type) {
      where.type = filters.type as any;
    }
    if (filters?.status) {
      where.status = filters.status as any;
    }
    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters?.areaId) {
      where.areaId = filters.areaId;
    }
    if (filters?.agentId) {
      where.agentId = filters.agentId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            include: {
              client: {
                select: {
                  id: true,
                  clientNumber: true,
                  fullName: true,
                },
              },
              agent: {
                select: {
                  id: true,
                  agentCode: true,
                  fullName: true,
                },
              },
            },
          },
          area: true,
          agent: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions(filters?: {
    type?: string;
    areaId?: string;
    agentId?: string;
    accountId?: string;
  }) {
    const where: Prisma.TransactionWhereInput = {
      status: 'PENDING_APPROVAL',
    };

    if (filters?.type) {
      where.type = filters.type as any;
    }
    if (filters?.areaId) {
      where.areaId = filters.areaId;
    }
    if (filters?.agentId) {
      where.agentId = filters.agentId;
    }
    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        account: {
          include: {
            client: {
              select: {
                id: true,
                clientNumber: true,
                fullName: true,
              },
            },
            agent: {
              select: {
                id: true,
                agentCode: true,
                fullName: true,
              },
            },
          },
        },
        area: true,
        agent: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string) {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            client: true,
            agent: true,
          },
        },
        area: true,
        agent: true,
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
        commission: true,
      },
    });
  }

  /**
   * Get transactions by account
   */
  async getTransactionsByAccount(accountId: string, filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.TransactionWhereInput = {
      accountId,
    };

    if (filters?.type) {
      where.type = filters.type as any;
    }
    if (filters?.status) {
      where.status = filters.status as any;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        area: true,
        agent: true,
        creator: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const transactionService = new TransactionService();
