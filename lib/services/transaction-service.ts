/**
 * Transaction Service
 * Handles all business logic for financial transactions
 * Implements four-eye principle for transaction approval
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  invalidateBalanceForAccount,
  invalidateRecentTransactionsForAccount,
  invalidateRecentTransactionsForAgent,
  invalidateAdminRecentTransactions,
  invalidateDashboardStats,
  invalidateCountCacheForEntity,
  invalidateTransactionListCache,
  invalidateTransactionDetail,
  invalidateAll,
} from '@/lib/cache';
import { getCachedCount } from '@/lib/cache';
import { getCachedOrFetch, getCachedOrFetchByKey } from '@/lib/cache/query-cache';
import { LIST_PREFIX_TRANSACTIONS, transactionDetailKey } from '@/lib/cache/keys';
import {
  capLimit,
  decodeCursor,
  encodeCursor,
  buildCountCacheKey,
} from '@/lib/utils/pagination';

const TXN_LIST_TTL = 30;
const TXN_DETAIL_TTL = 60;

async function notifyManagersOfPendingTransactions(count: number) {
  try {
    const { pushNotificationService } = await import('./push-notification-service');
    await pushNotificationService.sendPendingTransactionNotification(count);
  } catch (e) {
    console.error('Push notification failed:', e);
  }
}

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
   * @param tx - Optional Prisma transaction client for use within $transaction (e.g. loan disbursement)
   */
  async createTransaction(data: CreateTransactionInput, createdBy: string, tx?: Prisma.TransactionClient) {
    // Check session is open
    const sessionOpen = await this.isSessionOpen();
    if (!sessionOpen) {
      throw new Error('Daily session is closed. No transactions allowed.');
    }

    const client = tx ?? prisma;
    // Validate account exists and is active
    const account = await client.financialAccount.findUnique({
      where: { id: data.accountId },
      include: {
        client: { select: { id: true, approvalStatus: true } },
        agent: { select: { id: true, approvalStatus: true } },
        accountNature: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Client/Agent accounts must be approved before transactions
    if (account.client && account.client.approvalStatus !== 'APPROVED') {
      throw new Error('Client account must be approved by manager before transactions');
    }
    if (account.agent && account.agent.approvalStatus !== 'APPROVED') {
      throw new Error('Agent account must be approved by manager before transactions');
    }

    // Account nature operations matrix and restrictions
    if (account.accountNature) {
      const nature = account.accountNature;
      const opType = data.type;
      if (opType === 'DEPOSIT' || opType === 'COLLECTION' || opType === 'LOAN_DISBURSEMENT') {
        if (!nature.allowDeposit) {
          throw new Error(`Deposits are not allowed for ${nature.name} accounts`);
        }
      } else if (opType === 'WITHDRAWAL') {
        if (!nature.allowWithdrawal) {
          throw new Error(`Withdrawals are not allowed for ${nature.name} accounts`);
        }
        if (account.blockedUntil && new Date() < account.blockedUntil) {
          throw new Error('Account is blocked until maturity. Withdrawals not allowed.');
        }
        if (account.maturityDate && new Date() < account.maturityDate) {
          throw new Error('Account has not reached maturity. Withdrawals not allowed.');
        }
      } else if (opType === 'TRANSFER') {
        if (!nature.allowTransfer) {
          throw new Error(`Transfers are not allowed for ${nature.name} accounts`);
        }
        if (account.blockedUntil && new Date() < account.blockedUntil) {
          throw new Error('Account is blocked until maturity. Transfers not allowed.');
        }
        if (account.maturityDate && new Date() < account.maturityDate) {
          throw new Error('Account has not reached maturity. Transfers not allowed.');
        }
      }
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
      // Min balance check (after withdrawal, balance must not go below min)
      if (account.accountNature?.minBalance) {
        const minBal = account.accountNature.minBalance.toNumber();
        const balanceAfter = account.balance.toNumber() - data.amount;
        if (balanceAfter < minBal) {
          throw new Error(
            `Withdrawal would bring balance below minimum required (${minBal} XAF)`
          );
        }
      }
    }

    // Calculate balance after
    let balanceAfter = account.balance;
    if (data.type === 'DEPOSIT' || data.type === 'COLLECTION' || data.type === 'LOAN_DISBURSEMENT') {
      balanceAfter = (account.balance instanceof Prisma.Decimal ? account.balance.toNumber() : Number(account.balance)) + data.amount;
    } else if (data.type === 'WITHDRAWAL' || data.type === 'LOAN_REPAYMENT' || data.type === 'TRANSFER' || data.type === 'COMMISSION') {
      balanceAfter = (account.balance instanceof Prisma.Decimal ? account.balance.toNumber() : Number(account.balance)) - data.amount;
    }

    const transactionNumber = await this.generateTransactionNumber(tx);

    const created = await client.transaction.create({
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

    await client.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE',
        entityType: 'TRANSACTION',
        entityId: created.id,
        transactionId: created.id,
        description: `${data.type} ${data.amount} - ${created.transactionNumber} (account ${account.accountNumber})`,
      },
    });

    if (!tx) {
      const ops: Promise<unknown>[] = [
        invalidateRecentTransactionsForAccount(data.accountId),
        invalidateAdminRecentTransactions(),
        invalidateCountCacheForEntity('transactions'),
        invalidateTransactionListCache(),
        invalidateDashboardStats(),
      ];
      if (data.agentId) {
        ops.push(invalidateRecentTransactionsForAgent(data.agentId));
      }
      await invalidateAll(...ops);
      void notifyManagersOfPendingTransactions(1);
    }
    return created;
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

    // Validate agent is approved
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
      select: { approvalStatus: true },
    });
    if (!agent || agent.approvalStatus !== 'APPROVED') {
      throw new Error('Agent account must be approved before performing collections');
    }

    // Validate all clients belong to the area, are approved, and are assigned to this agent
    const clients = await prisma.client.findMany({
      where: {
        id: {
          in: data.entries.map((e) => e.clientId),
        },
        areaId: data.areaId,
        agentId: data.agentId,
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
      },
      include: {
        account: true,
      },
    });

    if (clients.length !== data.entries.length) {
      throw new Error(
        'Some clients were not found, do not belong to this area, or are not assigned to you.'
      );
    }

    // Create transactions for each entry
    const transactions = await Promise.all(
      data.entries.map(async (entry) => {
        const client = clients.find((c) => c.id === entry.clientId);
        if (!client) {
          throw new Error(`Client ${entry.clientId} not found`);
        }

        const transactionNumber = await this.generateTransactionNumber();
        const currentBalance = client.account.balance instanceof Prisma.Decimal ? client.account.balance.toNumber() : Number(client.account.balance);
        const balanceAfter = currentBalance + entry.amount;

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

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const area = await prisma.collectionArea.findUnique({
      where: { id: data.areaId },
      select: { code: true, name: true },
    });
    const agentForAudit = await prisma.agent.findUnique({
      where: { id: data.agentId },
      select: { agentCode: true, userId: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE',
        entityType: 'TRANSACTION',
        entityId: transactions[0]?.id ?? null,
        transactionId: transactions[0]?.id ?? null,
        description: `Collection batch: ${transactions.length} entries, total ${totalAmount} - area ${area?.code ?? data.areaId}, agent ${agentForAudit?.agentCode ?? data.agentId}`,
        changes: { entryCount: transactions.length, totalAmount, areaId: data.areaId, agentId: data.agentId },
      },
    });

    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    const collOps: Promise<unknown>[] = [
      ...accountIds.map((id) => invalidateRecentTransactionsForAccount(id)),
      invalidateRecentTransactionsForAgent(data.agentId),
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(agentForAudit?.userId),
    ];
    await invalidateAll(...collOps);

    void notifyManagersOfPendingTransactions(transactions.length);
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

    const result = await prisma.$transaction(async (tx) => {
      const sourceTxnNumber = await this.generateTransactionNumber(tx);
      const destTxnNumber = await this.generateTransactionNumber(tx);

      const sourceBalanceNum = sourceAccount.balance instanceof Prisma.Decimal ? sourceAccount.balance.toNumber() : Number(sourceAccount.balance);
      const destBalanceNum = destAccount.balance instanceof Prisma.Decimal ? destAccount.balance.toNumber() : Number(destAccount.balance);

      const sourceBalanceAfter = sourceBalanceNum - data.amount;
      const destBalanceAfter = destBalanceNum + data.amount;

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

      await tx.auditLog.create({
        data: {
          userId: createdBy,
          action: 'CREATE',
          entityType: 'TRANSACTION',
          entityId: sourceTxn.id,
          transactionId: sourceTxn.id,
          description: `Transfer ${data.amount} from ${sourceAccount.accountNumber} to ${destAccount.accountNumber}`,
          changes: {
            sourceTransactionId: sourceTxn.id,
            destinationTransactionId: destTxn.id,
            amount: data.amount,
          },
        },
      });

      return { sourceTransaction: sourceTxn, destinationTransaction: destTxn };
    });
    await invalidateAll(
      invalidateRecentTransactionsForAccount(data.sourceAccountId),
      invalidateRecentTransactionsForAccount(data.destinationAccountId),
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(),
    );
    void notifyManagersOfPendingTransactions(2);
    return result;
  }

  /**
   * Approve a transaction (four-eye principle)
   * For transfers, approves both linked transactions together
   * @param tx - Optional Prisma transaction client for use within $transaction (e.g. loan disbursement)
   */
  async approveTransaction(transactionId: string, approverId: string, notes?: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING_APPROVAL') {
      throw new Error(`Transaction is not pending approval. Current status: ${transaction.status}`);
    }

    // Check session is still open (skip when inside existing tx, e.g. loan disbursement)
    if (!tx) {
      const sessionOpen = await this.isSessionOpen();
      if (!sessionOpen) {
        throw new Error('Daily session is closed. Cannot approve transactions.');
      }
    }

    // For transfers, find the paired transaction
    const isTransfer = transaction.reference?.startsWith('transfer-');
    const pairedTransaction = isTransfer
      ? await db.transaction.findFirst({
        where: {
          reference: transaction.reference,
          id: { not: transactionId },
          status: 'PENDING_APPROVAL',
        },
        include: { account: true },
      })
      : null;

    const runInTx = async (innerTx: Prisma.TransactionClient) => {
      const transactionsToApprove = pairedTransaction
        ? [transaction, pairedTransaction]
        : [transaction];

      for (const txn of transactionsToApprove) {
        await innerTx.transaction.update({
          where: { id: txn.id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        // Re-query account for fresh availableBalance to avoid stale reads when processing multiple txns
        const freshAccount = await innerTx.financialAccount.findUnique({
          where: { id: txn.accountId },
          include: { accountNature: true },
        });
        const currentAvailable = freshAccount?.availableBalance instanceof Prisma.Decimal ? freshAccount.availableBalance.toNumber() : Number(freshAccount?.availableBalance ?? 0);
        const isCredit =
          txn.type === 'DEPOSIT' || txn.type === 'COLLECTION' || txn.type === 'LOAN_DISBURSEMENT';
        let newAvailableBalance = isCredit
          ? currentAvailable + txn.amount.toNumber()
          : currentAvailable - txn.amount.toNumber();
        let finalBalance = txn.balanceAfter;

        // Transaction fee on withdrawal (per account nature)
        if (txn.type === 'WITHDRAWAL' && freshAccount?.accountNature) {
          const { accountNatureService } = await import('./account-nature-service');
          const feeAmount = await accountNatureService.getTransactionFee(
            freshAccount.accountNature.id
          );
          if (feeAmount > 0) {
            const feeTxnNumber = await this.generateTransactionNumber(innerTx);
            const balBefore =
              typeof txn.balanceAfter === 'object' && 'toNumber' in txn.balanceAfter
                ? (txn.balanceAfter as { toNumber: () => number }).toNumber()
                : Number(txn.balanceAfter);
            const balAfterFee = balBefore - feeAmount;
            await innerTx.transaction.create({
              data: {
                transactionNumber: feeTxnNumber,
                accountId: txn.accountId,
                type: 'ADJUSTMENT',
                amount: feeAmount,
                balanceBefore: txn.balanceAfter,
                balanceAfter: balAfterFee,
                status: 'COMPLETED',
                description: `Transaction fee (${freshAccount.accountNature.name})`,
                reference: `fee-for-${txn.transactionNumber}`,
                createdBy: approverId,
                approvedBy: approverId,
                approvedAt: new Date(),
              },
            });
            finalBalance = balAfterFee;
            newAvailableBalance -= feeAmount;
          }
        }

        await innerTx.financialAccount.update({
          where: { id: txn.accountId },
          data: {
            balance: finalBalance,
            availableBalance: newAvailableBalance,
          },
        });

        await innerTx.transaction.update({
          where: { id: txn.id },
          data: { status: 'COMPLETED' },
        });

        await innerTx.auditLog.create({
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

      return await innerTx.transaction.findUnique({
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
    };

    if (tx) {
      return runInTx(tx);
    }
    const result = await prisma.$transaction(runInTx);
    const transactionsToInvalidate = pairedTransaction
      ? [transaction, pairedTransaction]
      : [transaction];
    const ops: Promise<unknown>[] = [
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(),
    ];
    for (const txn of transactionsToInvalidate) {
      ops.push(
        invalidateBalanceForAccount(txn.accountId),
        invalidateRecentTransactionsForAccount(txn.accountId),
        invalidateTransactionDetail(txn.id),
      );
      if (txn.agentId) {
        ops.push(invalidateRecentTransactionsForAgent(txn.agentId));
      }
    }
    await invalidateAll(...ops);
    return result;
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

    const result = await prisma.$transaction(async (tx) => {
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

    const txnsToInvalidate = pairedTransaction
      ? [transaction, pairedTransaction]
      : [transaction];
    const rejectOps: Promise<unknown>[] = [
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(),
    ];
    for (const txn of txnsToInvalidate) {
      rejectOps.push(
        invalidateRecentTransactionsForAccount(txn.accountId),
        invalidateTransactionDetail(txn.id),
      );
      if (txn.agentId) {
        rejectOps.push(invalidateRecentTransactionsForAgent(txn.agentId));
      }
    }
    await invalidateAll(...rejectOps);
    return result;
  }

  /**
   * Get transactions with optional filters (for list view)
   * Supports offset-based (default) and cursor-based pagination.
   */
  async getTransactions(filters?: {
    type?: string;
    status?: string;
    accountId?: string;
    areaId?: string;
    agentId?: string;
    search?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    cursor?: string;
    select?: Prisma.TransactionSelect;
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
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { transactionNumber: { contains: term, mode: 'insensitive' } },
        { reference: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        {
          account: {
            OR: [
              { accountNumber: { contains: term, mode: 'insensitive' } },
              {
                client: {
                  OR: [
                    { fullName: { contains: term, mode: 'insensitive' } },
                    { clientNumber: { contains: term, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
        },
      ];
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

    const useCursor = !!filters?.cursor;
    const decodedCursor = useCursor ? decodeCursor(filters.cursor!) : null;

    let finalWhere: Prisma.TransactionWhereInput = where;
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
    const countCacheKey = buildCountCacheKey('transactions', {
      type: filters?.type,
      status: filters?.status,
      accountId: filters?.accountId,
      areaId: filters?.areaId,
      agentId: filters?.agentId,
      search: filters?.search?.trim() || undefined,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString(),
    });

    const defaultSelect: Prisma.TransactionSelect = {
      id: true,
      transactionNumber: true,
      type: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      status: true,
      description: true,
      reference: true,
      createdAt: true,
      approvedAt: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          client: {
            select: {
              id: true,
              clientNumber: true,
              fullName: true,
            },
          },
        },
      },
    };

    const TXN_SORT_FIELDS = ['createdAt', 'amount', 'type', 'status', 'transactionNumber'];
    const sortField = filters?.sort && TXN_SORT_FIELDS.includes(filters.sort) ? filters.sort : 'createdAt';
    const sortDir = filters?.dir === 'asc' ? 'asc' : 'desc';
    const orderBy = useCursor ? { createdAt: 'desc' as const } : { [sortField]: sortDir };

    const cacheParams = {
      type: filters?.type,
      status: filters?.status,
      accountId: filters?.accountId,
      areaId: filters?.areaId,
      agentId: filters?.agentId,
      search: filters?.search?.trim() || undefined,
      sort: sortField,
      dir: sortDir,
      limit,
      offset: useCursor ? 0 : (filters?.offset ?? 0),
      cursor: filters?.cursor,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString(),
      hasSelect: !!filters?.select,
    };

    const result = await getCachedOrFetch(LIST_PREFIX_TRANSACTIONS, cacheParams, TXN_LIST_TTL, async () => {
      const [rows, count] = await Promise.all([
        prisma.transaction.findMany({
          where: finalWhere,
          select: filters?.select
            ? { ...filters.select, id: true, createdAt: true }
            : defaultSelect,
          orderBy,
          take: limit,
          skip: useCursor ? 0 : (filters?.offset ?? 0),
        }),
        getCachedCount(countCacheKey, () => prisma.transaction.count({ where })),
      ]);
      return { rows, count };
    });

    const transactions = result.rows;
    const total = result.count;

    const last = transactions[transactions.length - 1];
    const nextCursor =
      useCursor && last && transactions.length === limit
        ? encodeCursor(last.createdAt, last.id)
        : null;

    return {
      transactions,
      total,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions(filters?: {
    type?: string;
    areaId?: string;
    agentId?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
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
      select: {
        id: true,
        transactionNumber: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        reference: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            accountNumber: true,
            client: {
              select: { id: true, clientNumber: true, fullName: true },
            },
            agent: {
              select: { id: true, agentCode: true, fullName: true },
            },
          },
        },
        area: { select: { id: true, code: true, name: true } },
        agent: { select: { id: true, agentCode: true, fullName: true } },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: capLimit(filters?.limit),
      skip: filters?.offset ?? 0,
    });
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string) {
    return getCachedOrFetchByKey(transactionDetailKey(id), TXN_DETAIL_TTL, () =>
      prisma.transaction.findUnique({
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
      }),
    );
  }

  /**
   * Get transactions by account
   */
  async getTransactionsByAccount(accountId: string, filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
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
      select: {
        id: true,
        transactionNumber: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        reference: true,
        createdAt: true,
        area: { select: { id: true, code: true, name: true } },
        agent: { select: { id: true, agentCode: true, fullName: true } },
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: capLimit(filters?.limit),
      skip: filters?.offset ?? 0,
    });
  }
}

export const transactionService = new TransactionService();
