/**
 * Cache invalidation helpers.
 * Call these after balance-affecting or transaction-affecting operations.
 */

import { prisma } from '@/lib/prisma';
import { redisDel, redisDelPattern } from './redis';
import {
  userBalanceKey,
  userTransactionsRecentKey,
  accountTransactionsRecentKey,
  adminTransactionsRecentKey,
  clientLoansKey,
  loanDetailKey,
  loanRepaymentsKey,
  interestRatesKey,
  loanRulesKey,
  dashboardAdminStatsKey,
  dashboardAgentStatsKey,
  sessionStatusTodayKey,
  agentDetailKey,
  agentByUserKey,
  clientDetailKey,
  transactionDetailKey,
  areaDetailKey,
  LIST_PREFIX_CLIENTS,
  LIST_PREFIX_TRANSACTIONS,
  LIST_PREFIX_LOANS,
  LIST_PREFIX_AGENTS,
  LIST_PREFIX_AREAS,
  LIST_PREFIX_COMMISSIONS,
} from './keys';

const COUNT_KEY_PREFIX = 'count:';

/**
 * Run multiple invalidation promises in parallel. Failures are silently ignored.
 */
export function invalidateAll(
  ...fns: Array<Promise<unknown>>
): Promise<void> {
  return Promise.allSettled(fns).then(() => undefined);
}

/**
 * Invalidate user balance cache for all users linked to this account.
 * Resolves accountId -> Client/Agent -> userId.
 */
export async function invalidateBalanceForAccount(
  accountId: string
): Promise<void> {
  const userIds: string[] = [];

  const agent = await prisma.agent.findUnique({
    where: { accountId },
    select: { userId: true },
  });
  if (agent) userIds.push(agent.userId);

  const client = await prisma.client.findUnique({
    where: { accountId },
    select: { userId: true },
  });
  if (client?.userId) userIds.push(client.userId);

  await Promise.all(userIds.map((id) => redisDel(userBalanceKey(id))));
}

/**
 * Invalidate recent transactions cache for an account.
 */
export async function invalidateRecentTransactionsForAccount(
  accountId: string
): Promise<void> {
  await redisDel(accountTransactionsRecentKey(accountId));
}

/**
 * Invalidate recent transactions cache for an agent (agent dashboard).
 */
export async function invalidateRecentTransactionsForAgent(
  agentId: string
): Promise<void> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { userId: true },
  });
  if (agent) {
    await redisDel(userTransactionsRecentKey(agent.userId));
  }
}

/**
 * Invalidate admin dashboard recent transactions cache (global list).
 */
export async function invalidateAdminRecentTransactions(): Promise<void> {
  await redisDel(adminTransactionsRecentKey());
}

/**
 * Invalidate loans list cache for a client.
 */
export async function invalidateLoansForClient(
  clientId: string
): Promise<void> {
  await redisDel(clientLoansKey(clientId));
}

/**
 * Invalidate loan detail cache.
 */
export async function invalidateLoanDetail(loanId: string): Promise<void> {
  await redisDel(loanDetailKey(loanId));
}

/**
 * Invalidate loan repayments cache.
 */
export async function invalidateLoanRepayments(loanId: string): Promise<void> {
  await redisDel(loanRepaymentsKey(loanId));
}

/**
 * Invalidate interest rates placeholder cache.
 */
export async function invalidateInterestRates(): Promise<void> {
  await redisDel(interestRatesKey());
}

/**
 * Invalidate loan rules placeholder cache.
 */
export async function invalidateLoanRules(): Promise<void> {
  await redisDel(loanRulesKey());
}

/**
 * Invalidate all config caches (interest rates, loan rules, exchange rates).
 */
export async function invalidateAllConfigCaches(): Promise<void> {
  await redisDel(interestRatesKey());
  await redisDel(loanRulesKey());
  await redisDelPattern('exchange:rate:*');
}

/**
 * Invalidate dashboard stats cache.
 * @param userId - If provided, invalidates agent stats for that user; otherwise invalidates admin stats.
 */
export async function invalidateDashboardStats(
  userId?: string
): Promise<void> {
  await redisDel(dashboardAdminStatsKey());
  if (userId) {
    await redisDel(dashboardAgentStatsKey(userId));
  }
}

/**
 * Invalidate the daily session status cache.
 * Call after opening, closing, or locking a session.
 */
export async function invalidateSessionStatus(): Promise<void> {
  await redisDel(sessionStatusTodayKey());
}

/**
 * Invalidate count cache for an entity (clients, transactions, loans).
 * Call after create/update/delete operations that affect list counts.
 */
export async function invalidateCountCacheForEntity(
  entity: string
): Promise<void> {
  await redisDelPattern(`${COUNT_KEY_PREFIX}${entity}:*`);
}

// ── List query cache invalidation ────────────────────────────────

export async function invalidateClientListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_CLIENTS}:*`);
}

export async function invalidateTransactionListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_TRANSACTIONS}:*`);
}

export async function invalidateLoanListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_LOANS}:*`);
}

export async function invalidateAgentListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_AGENTS}:*`);
}

export async function invalidateAreaListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_AREAS}:*`);
}

export async function invalidateCommissionListCache(): Promise<void> {
  await redisDelPattern(`query:${LIST_PREFIX_COMMISSIONS}:*`);
}

// ── Detail cache invalidation ────────────────────────────────────

export async function invalidateClientDetail(clientId: string): Promise<void> {
  await redisDel(clientDetailKey(clientId));
}

export async function invalidateTransactionDetail(txnId: string): Promise<void> {
  await redisDel(transactionDetailKey(txnId));
}

export async function invalidateAgentDetail(agentId: string): Promise<void> {
  await redisDel(agentDetailKey(agentId));
}

export async function invalidateAgentByUser(userId: string): Promise<void> {
  await redisDel(agentByUserKey(userId));
}

export async function invalidateAreaDetail(areaId: string): Promise<void> {
  await redisDel(areaDetailKey(areaId));
}
