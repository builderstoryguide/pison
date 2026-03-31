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
  invalidateAgentByUser,
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
import { MinBalanceViolationError, MIN_BALANCE_ACK_MARKER } from '@/lib/errors/transaction-errors';
import {
  getDbNow,
  getDbCalendarDayStart,
  getOpenDailySessionIdForDbToday,
  transactionNumberDatePrefix,
} from '@/lib/utils/db-time';

const TXN_LIST_TTL = 30;
const TXN_DETAIL_TTL = 60;

const VENTILATION_DEBIT_TYPES = new Set<string>(['WITHDRAWAL', 'TRANSFER', 'LOAN_REPAYMENT', 'COMMISSION']);

/** Process payer debits before client credits when approving a ventilation batch */
function sortVentilationApprovalOrder<T extends { type: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const da = VENTILATION_DEBIT_TYPES.has(a.type) ? 0 : 1;
    const db = VENTILATION_DEBIT_TYPES.has(b.type) ? 0 : 1;
    return da - db;
  });
}

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
  /** When true, allows withdrawal that would go below account nature minimum balance (still blocks if amount > available). */
  acknowledgeMinBalanceViolation?: boolean;
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
  acknowledgeMinBalanceViolation?: boolean;
}

export class TransactionService {
  /**
   * Generate unique transaction number
   * @param tx - Optional Prisma transaction client for use within $transaction callbacks
   */
  private async generateTransactionNumber(tx?: Prisma.TransactionClient): Promise<string> {
    const dbNow = await getDbNow(tx);
    const dateStr = transactionNumberDatePrefix(dbNow);
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
    const today = await getDbCalendarDayStart();
    const session = await prisma.dailySession.findFirst({
      where: { sessionDate: today, status: 'OPEN' },
    });
    return session != null;
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
      const compareNow = await getDbNow(client);
      if (opType === 'DEPOSIT' || opType === 'COLLECTION' || opType === 'LOAN_DISBURSEMENT') {
        if (!nature.allowDeposit) {
          throw new Error(`Deposits are not allowed for ${nature.name} accounts`);
        }
      } else if (opType === 'WITHDRAWAL') {
        if (!nature.allowWithdrawal) {
          throw new Error(`Withdrawals are not allowed for ${nature.name} accounts`);
        }
        if (account.blockedUntil && compareNow < account.blockedUntil) {
          throw new Error('Account is blocked until maturity. Withdrawals not allowed.');
        }
        if (account.maturityDate && compareNow < account.maturityDate) {
          throw new Error('Account has not reached maturity. Withdrawals not allowed.');
        }
      } else if (opType === 'TRANSFER') {
        if (!nature.allowTransfer) {
          throw new Error(`Transfers are not allowed for ${nature.name} accounts`);
        }
        if (account.blockedUntil && compareNow < account.blockedUntil) {
          throw new Error('Account is blocked until maturity. Transfers not allowed.');
        }
        if (account.maturityDate && compareNow < account.maturityDate) {
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
      // Min balance: block unless explicitly acknowledged (withdrawal/transfer only)
      if (account.accountNature?.minBalance) {
        const minBal = account.accountNature.minBalance.toNumber();
        const balanceAfter = account.balance.toNumber() - data.amount;
        if (balanceAfter < minBal) {
          if (!data.acknowledgeMinBalanceViolation) {
            throw new MinBalanceViolationError(
              `Withdrawal would bring balance below minimum required (${minBal} XAF)`,
              { minBalance: minBal, projectedBalance: balanceAfter }
            );
          }
        }
      }
    }

    let descriptionForCreate = data.description;
    if (
      data.acknowledgeMinBalanceViolation &&
      (data.type === 'WITHDRAWAL' || data.type === 'TRANSFER') &&
      account.accountNature?.minBalance
    ) {
      const minBal = account.accountNature.minBalance.toNumber();
      const balanceAfter = account.balance.toNumber() - data.amount;
      if (balanceAfter < minBal) {
        descriptionForCreate = [data.description?.trim(), MIN_BALANCE_ACK_MARKER]
          .filter(Boolean)
          .join(' ');
      }
    }

    // Calculate balance after
    let balanceAfter = account.balance;
    if (data.type === 'DEPOSIT' || data.type === 'COLLECTION' || data.type === 'LOAN_DISBURSEMENT') {
      balanceAfter = new Prisma.Decimal((account.balance instanceof Prisma.Decimal ? account.balance.toNumber() : Number(account.balance)) + data.amount);
    } else if (data.type === 'WITHDRAWAL' || data.type === 'LOAN_REPAYMENT' || data.type === 'TRANSFER' || data.type === 'COMMISSION') {
      balanceAfter = new Prisma.Decimal((account.balance instanceof Prisma.Decimal ? account.balance.toNumber() : Number(account.balance)) - data.amount);
    }

    const transactionNumber = await this.generateTransactionNumber(tx);
    const dailySessionId = await getOpenDailySessionIdForDbToday(client);

    const created = await client.transaction.create({
      data: {
        transactionNumber,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        balanceBefore: account.balance,
        balanceAfter,
        status: 'PENDING_APPROVAL',
        description: descriptionForCreate,
        reference: data.reference,
        areaId: data.areaId,
        agentId: data.agentId,
        ...(dailySessionId ? { dailySessionId } : {}),
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
   * Issue treasury liquidity (digital float) onto the manager's operating account.
   * Immediate COMPLETED transaction; manager role enforced by API layer.
   */
  async issueTreasuryLiquidity(managerUserId: string, amount: number, description?: string) {
    if (amount <= 0 || !Number.isFinite(amount)) {
      throw new Error('Amount must be a positive number');
    }

    const user = await prisma.user.findUnique({
      where: { id: managerUserId },
      include: {
        role: { select: { slug: true } },
        operatingAccount: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roleSlug = (user.role?.slug || '').toLowerCase();
    if (roleSlug !== 'manager') {
      throw new Error('Only managers can issue treasury liquidity');
    }

    if (!user.operatingAccountId || !user.operatingAccount) {
      throw new Error('Manager has no operating account. contact support or re-run staff account setup.');
    }

    const account = user.operatingAccount;
    if (account.status !== 'ACTIVE') {
      throw new Error('Operating account is not active');
    }

    const amountDec = new Prisma.Decimal(amount);
    const balBefore = account.balance;
    const balNum =
      balBefore instanceof Prisma.Decimal ? balBefore.toNumber() : Number(balBefore);
    const availNum =
      account.availableBalance instanceof Prisma.Decimal
        ? account.availableBalance.toNumber()
        : Number(account.availableBalance);
    const balanceAfter = new Prisma.Decimal(balNum + amount);
    const availableAfter = new Prisma.Decimal(availNum + amount);

    const result = await prisma.$transaction(async (tx) => {
      const [transactionNumber, treasuryApprovedAt, treasurySessionId] = await Promise.all([
        this.generateTransactionNumber(tx),
        getDbNow(tx),
        getOpenDailySessionIdForDbToday(tx),
      ]);
      const txn = await tx.transaction.create({
        data: {
          transactionNumber,
          accountId: account.id,
          type: 'TREASURY_ISSUANCE',
          amount: amountDec,
          balanceBefore: balBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: description?.trim() || 'Treasury liquidity issuance',
          createdBy: managerUserId,
          approvedBy: managerUserId,
          approvedAt: treasuryApprovedAt,
          ...(treasurySessionId ? { dailySessionId: treasurySessionId } : {}),
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
          userId: managerUserId,
          action: 'TREASURY_ISSUE',
          entityType: 'TRANSACTION',
          entityId: txn.id,
          transactionId: txn.id,
          description: `Treasury issuance ${amount} — ${txn.transactionNumber}`,
          changes: { amount, accountId: account.id },
        },
      });

      return tx.transaction.findUnique({
        where: { id: txn.id },
        include: {
          account: true,
          approver: { select: { id: true, name: true, email: true } },
        },
      });
    });

    await invalidateAll(
      invalidateBalanceForAccount(account.id),
      invalidateRecentTransactionsForAccount(account.id),
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(),
    );

    return result!;
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

    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
      include: {
        account: true,
      },
    });

    if (!agent || agent.approvalStatus !== 'APPROVED') {
      throw new Error('Agent account must be approved before performing collections');
    }

    if (!agent.account) {
      throw new Error('Agent has no financial account');
    }

    // Validate all clients belong to the area and are approved
    const clients = await prisma.client.findMany({
      where: {
        id: {
          in: data.entries.map((e) => e.clientId),
        },
        areaId: data.areaId,
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
      },
      include: {
        account: true,
      },
    });

    if (clients.length !== data.entries.length) {
      throw new Error(
        'Some clients were not found or do not belong to this area.'
      );
    }

    let totalDec = new Prisma.Decimal(0);
    for (const e of data.entries) {
      totalDec = totalDec.add(new Prisma.Decimal(e.amount));
    }

    const payerAvailable = agent.account.availableBalance;
    const payerAvailNum =
      payerAvailable instanceof Prisma.Decimal ? payerAvailable.toNumber() : Number(payerAvailable);
    if (payerAvailNum + 1e-9 < totalDec.toNumber()) {
      throw new Error(
        `Insufficient balance in agent operating account for this ventilation. Required: ${totalDec.toFixed(2)}, available: ${payerAvailNum.toFixed(2)}.`
      );
    }

    const batchRef = `ventilation-${crypto.randomUUID()}`;
    const payerBalanceBefore = agent.account.balance;
    const payerBalNum =
      payerBalanceBefore instanceof Prisma.Decimal
        ? payerBalanceBefore.toNumber()
        : Number(payerBalanceBefore);
    const payerBalanceAfter = new Prisma.Decimal(payerBalNum - totalDec.toNumber());

    const transactions = await prisma.$transaction(async (tx) => {
      const ventilationSessionId = await getOpenDailySessionIdForDbToday(tx);
      const sessionFields = ventilationSessionId ? { dailySessionId: ventilationSessionId } : {};

      const payerTxnNumber = await this.generateTransactionNumber(tx);
      const payerDebit = await tx.transaction.create({
        data: {
          transactionNumber: payerTxnNumber,
          accountId: agent.accountId,
          type: 'WITHDRAWAL',
          amount: totalDec,
          balanceBefore: payerBalanceBefore,
          balanceAfter: payerBalanceAfter,
          status: 'PENDING_APPROVAL',
          description: `Ventilation batch disbursement (${data.entries.length} clients)`,
          reference: batchRef,
          areaId: data.areaId,
          agentId: data.agentId,
          ...sessionFields,
          createdBy,
        },
      });

      const clientTxns = await Promise.all(
        data.entries.map(async (entry) => {
          const client = clients.find((c) => c.id === entry.clientId);
          if (!client) {
            throw new Error(`Client ${entry.clientId} not found`);
          }

          const transactionNumber = await this.generateTransactionNumber(tx);
          const currentBalance =
            client.account.balance instanceof Prisma.Decimal
              ? client.account.balance.toNumber()
              : Number(client.account.balance);
          const balanceAfter = currentBalance + entry.amount;

          return await tx.transaction.create({
            data: {
              transactionNumber,
              accountId: client.accountId,
              clientId: client.id,
              type: 'COLLECTION',
              amount: entry.amount,
              balanceBefore: client.account.balance,
              balanceAfter,
              status: 'PENDING_APPROVAL',
              description: entry.description || `Collection from area ${data.areaId}`,
              reference: batchRef,
              areaId: data.areaId,
              agentId: data.agentId,
              ...sessionFields,
              createdBy,
            },
          });
        })
      );

      return [payerDebit, ...clientTxns];
    });

    const totalAmount = totalDec.toNumber();
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
        description: `Ventilation batch: ${data.entries.length} client entries + payer debit, total ${totalAmount} — ref ${batchRef} — area ${area?.code ?? data.areaId}, agent ${agentForAudit?.agentCode ?? data.agentId}`,
        changes: {
          entryCount: data.entries.length,
          totalCount: transactions.length,
          totalAmount,
          reference: batchRef,
          areaId: data.areaId,
          agentId: data.agentId,
        },
      },
    });

    const accountIds = Array.from(new Set(transactions.map((t) => t.accountId)));
    const collOps: Promise<unknown>[] = [
      ...accountIds.map((id) => invalidateRecentTransactionsForAccount(id)),
      invalidateRecentTransactionsForAgent(data.agentId),
      invalidateAdminRecentTransactions(),
      invalidateCountCacheForEntity('transactions'),
      invalidateTransactionListCache(),
      invalidateDashboardStats(agentForAudit?.userId),
    ];
    await invalidateAll(...collOps);
    if (agentForAudit?.userId) {
      await invalidateAgentByUser(agentForAudit.userId);
    }

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
      prisma.financialAccount.findUnique({
        where: { id: data.sourceAccountId },
        include: { accountNature: true },
      }),
      prisma.financialAccount.findUnique({ where: { id: data.destinationAccountId } }),
    ]);

    if (!sourceAccount) throw new Error('Source account not found');
    if (!destAccount) throw new Error('Destination account not found');
    if (sourceAccount.status !== 'ACTIVE') throw new Error('Source account is not active');
    if (destAccount.status !== 'ACTIVE') throw new Error('Destination account is not active');

    if (sourceAccount.availableBalance.toNumber() < data.amount) {
      throw new Error('Insufficient available balance in source account');
    }

    const sourceBalanceNum =
      sourceAccount.balance instanceof Prisma.Decimal
        ? sourceAccount.balance.toNumber()
        : Number(sourceAccount.balance);
    const projectedSourceAfter = sourceBalanceNum - data.amount;
    if (sourceAccount.accountNature?.minBalance) {
      const minBal = sourceAccount.accountNature.minBalance.toNumber();
      if (projectedSourceAfter < minBal) {
        if (!data.acknowledgeMinBalanceViolation) {
          throw new MinBalanceViolationError(
            `Transfer would bring source balance below minimum required (${minBal} XAF)`,
            { minBalance: minBal, projectedBalance: projectedSourceAfter }
          );
        }
      }
    }

    const sourceDescriptionBase = data.description || `Transfer to ${destAccount.accountNumber}`;
    const sourceDescriptionFinal =
      data.acknowledgeMinBalanceViolation &&
      sourceAccount.accountNature?.minBalance &&
      projectedSourceAfter < sourceAccount.accountNature.minBalance.toNumber()
        ? [sourceDescriptionBase.trim(), MIN_BALANCE_ACK_MARKER].filter(Boolean).join(' ')
        : sourceDescriptionBase;

    const transferRef = `transfer-${crypto.randomUUID()}`;

    const result = await prisma.$transaction(async (tx) => {
      const transferSessionId = await getOpenDailySessionIdForDbToday(tx);
      const transferSessionFields = transferSessionId ? { dailySessionId: transferSessionId } : {};

      const sourceTxnNumber = await this.generateTransactionNumber(tx);
      const destTxnNumber = await this.generateTransactionNumber(tx);

      const destBalanceNum = destAccount.balance instanceof Prisma.Decimal ? destAccount.balance.toNumber() : Number(destAccount.balance);

      const sourceBalanceAfter = projectedSourceAfter;
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
            description: sourceDescriptionFinal,
            reference: transferRef,
            ...transferSessionFields,
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
            ...transferSessionFields,
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

    // Idempotent: if already approved/completed, return existing transaction (handles double-clicks, stale UI, transfer pairs)
    if (transaction.status === 'COMPLETED' || transaction.status === 'APPROVED') {
      const existing = await db.transaction.findUnique({
        where: { id: transactionId },
        include: {
          account: true,
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      return existing!;
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

    const ref = transaction.reference;
    const isVentilation = Boolean(ref?.startsWith('ventilation-'));
    let ventilationBatch: Prisma.TransactionGetPayload<{ include: { account: true } }>[] | null =
      null;

    if (isVentilation && ref) {
      const pending = await db.transaction.findMany({
        where: { reference: ref, status: 'PENDING_APPROVAL' },
        include: { account: true },
      });
      if (pending.length === 0) {
        const allForRef = await db.transaction.findMany({ where: { reference: ref } });
        const allCompleted =
          allForRef.length > 0 && allForRef.every((t) => t.status === 'COMPLETED');
        if (allCompleted) {
          const existing = await db.transaction.findUnique({
            where: { id: transactionId },
            include: {
              account: true,
              approver: {
                select: { id: true, name: true, email: true },
              },
            },
          });
          return existing!;
        }
        throw new Error('Ventilation batch has no pending transactions');
      }
      ventilationBatch = pending;
    }

    // For transfers, find the paired transaction
    const isTransfer = Boolean(!isVentilation && ref?.startsWith('transfer-'));
    const pairedTransaction = isTransfer
      ? await db.transaction.findFirst({
          where: {
            reference: ref,
            id: { not: transactionId },
            status: 'PENDING_APPROVAL',
          },
          include: { account: true },
        })
      : null;

    const runInTx = async (innerTx: Prisma.TransactionClient) => {
      const transactionsToApprove = ventilationBatch
        ? sortVentilationApprovalOrder(ventilationBatch)
        : pairedTransaction
          ? [transaction, pairedTransaction]
          : [transaction];

      const approvedAt = await getDbNow(innerTx);

      for (const txn of transactionsToApprove) {
        await innerTx.transaction.update({
          where: { id: txn.id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt,
          },
        });

        // Re-query account for fresh availableBalance to avoid stale reads when processing multiple txns
        const freshAccount = await innerTx.financialAccount.findUnique({
          where: { id: txn.accountId },
          include: { accountNature: true },
        });
        const currentAvailable = freshAccount?.availableBalance instanceof Prisma.Decimal ? freshAccount.availableBalance.toNumber() : Number(freshAccount?.availableBalance ?? 0);
        const isCredit =
          txn.type === 'DEPOSIT' ||
          txn.type === 'COLLECTION' ||
          txn.type === 'LOAN_DISBURSEMENT' ||
          txn.type === 'TREASURY_ISSUANCE';
        if (!isCredit && currentAvailable + 1e-9 < txn.amount.toNumber()) {
          throw new Error(
            'Insufficient available balance to approve this debit. Reject the batch if it is a ventilation.',
          );
        }
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
                approvedAt,
                ...(txn.dailySessionId ? { dailySessionId: txn.dailySessionId } : {}),
              },
            });
            finalBalance = new Prisma.Decimal(balAfterFee);
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
    const transactionsToInvalidate = ventilationBatch
      ? ventilationBatch
      : pairedTransaction
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

    const rejRef = transaction.reference;
    const isVentilationReject = Boolean(rejRef?.startsWith('ventilation-'));
    const ventilationRejectBatch =
      isVentilationReject && rejRef
        ? await prisma.transaction.findMany({
            where: { reference: rejRef, status: 'PENDING_APPROVAL' },
          })
        : [];

    const isTransfer = Boolean(!isVentilationReject && rejRef?.startsWith('transfer-'));
    const pairedTransaction = isTransfer
      ? await prisma.transaction.findFirst({
          where: {
            reference: rejRef,
            id: { not: transactionId },
            status: 'PENDING_APPROVAL',
          },
        })
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const transactionsToReject =
        ventilationRejectBatch.length > 0
          ? ventilationRejectBatch
          : pairedTransaction
            ? [transaction, pairedTransaction]
            : [transaction];

      const rejectedAt = await getDbNow(tx);

      for (const txn of transactionsToReject) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: {
            status: 'REJECTED',
            approvedBy: approverId,
            approvedAt: rejectedAt,
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

    const txnsToInvalidate =
      ventilationRejectBatch.length > 0
        ? ventilationRejectBatch
        : pairedTransaction
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
    createdById?: string;
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
    if (filters?.createdById) {
      where.createdBy = filters.createdById;
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
        {
          agent: {
            OR: [
              { fullName: { contains: term, mode: 'insensitive' } },
              { agentCode: { contains: term, mode: 'insensitive' } },
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
      createdById: filters?.createdById,
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
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      agent: {
        select: { id: true, agentCode: true, fullName: true },
      },
      area: {
        select: { id: true, code: true, name: true },
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
      createdById: filters?.createdById,
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
