/**
 * Cache key builders for DCMS Redis caching.
 */

export function userBalanceKey(userId: string): string {
  return `user:balance:${userId}`;
}

export function userTransactionsRecentKey(userId: string): string {
  return `user:transactions:${userId}:recent`;
}

export function accountTransactionsRecentKey(accountId: string): string {
  return `account:transactions:${accountId}:recent`;
}

/** Admin dashboard: global recent transactions list */
export function adminTransactionsRecentKey(): string {
  return 'admin:transactions:recent';
}

/** Client loans list cache */
export function clientLoansKey(clientId: string): string {
  return `client:loans:${clientId}`;
}

/** Loan detail cache */
export function loanDetailKey(loanId: string): string {
  return `loan:detail:${loanId}`;
}

/** Loan repayments cache */
export function loanRepaymentsKey(loanId: string): string {
  return `loan:repayments:${loanId}`;
}

/** Admin dashboard full stats cache */
export function dashboardAdminStatsKey(): string {
  return 'dashboard:admin:stats';
}

/** Surplus/shortage summary for dashboard (last 30 days) */
export function dashboardSurplusShortageSummaryKey(): string {
  return 'dashboard:surplus_shortage:summary';
}

/** Agent dashboard stats cache */
export function dashboardAgentStatsKey(userId: string): string {
  return `dashboard:agent:${userId}:stats`;
}

/** Report query cache - use with queryCacheKey prefix */
export function reportQueryKey(prefix: string, hash: string): string {
  return `report:${prefix}:${hash}`;
}

// Placeholder keys for future config caches
export function interestRatesKey(): string {
  return 'interest:rates';
}

export function exchangeRateKey(currencyPair: string): string {
  return `exchange:rate:${currencyPair}`;
}

export function loanRulesKey(): string {
  return 'loan:rules';
}

export function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

/** Daily session status cache (for session enforcer) */
export function sessionStatusTodayKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `session:status:${today}`;
}

// ── Entity list / detail cache keys ──────────────────────────────

/** Agent detail cache by agent id */
export function agentDetailKey(agentId: string): string {
  return `agent:detail:${agentId}`;
}

/** Agent detail cache by userId */
export function agentByUserKey(userId: string): string {
  return `agent:byUser:${userId}`;
}

/** Client detail cache */
export function clientDetailKey(clientId: string): string {
  return `client:detail:${clientId}`;
}

/** Transaction detail cache */
export function transactionDetailKey(txnId: string): string {
  return `transaction:detail:${txnId}`;
}

/** Collection area detail cache */
export function areaDetailKey(areaId: string): string {
  return `area:detail:${areaId}`;
}

// ── List query cache prefixes (used with queryCacheKey) ─────────
// These are just string constants; the actual key includes an MD5 of the filters.

export const LIST_PREFIX_CLIENTS = 'list:clients';
export const LIST_PREFIX_TRANSACTIONS = 'list:transactions';
export const LIST_PREFIX_LOANS = 'list:loans';
export const LIST_PREFIX_AGENTS = 'list:agents';
export const LIST_PREFIX_AREAS = 'list:areas';
export const LIST_PREFIX_COMMISSIONS = 'list:commissions';
