/**
 * Placeholder cache functions for future config caches.
 * When Redis is available and config sources exist, implement get/set with specified TTLs.
 *
 * TTLs from spec:
 * - interest:rates: 86400s (24h)
 * - exchange:rate:{pair}: 3600s (1h)
 * - loan:rules: 3600s (1h)
 * - session:{id}: match session timeout
 */

import { redisGet, redisSet } from './redis';
import {
  interestRatesKey,
  exchangeRateKey,
  loanRulesKey,
  sessionKey,
} from './keys';

/** Placeholder: Interest rate tables. TTL 24h when implemented. */
export async function getCachedInterestRates(): Promise<unknown | null> {
  return redisGet(interestRatesKey());
}

/** Placeholder: Set interest rates (for future config). */
export async function setCachedInterestRates(
  value: unknown,
  ttlSeconds = 86400
): Promise<boolean> {
  return redisSet(interestRatesKey(), value, ttlSeconds);
}

/** Placeholder: Exchange rate. TTL 1h when implemented. */
export async function getCachedExchangeRate(
  currencyPair: string
): Promise<unknown | null> {
  return redisGet(exchangeRateKey(currencyPair));
}

/** Placeholder: Set exchange rate (for future config). */
export async function setCachedExchangeRate(
  currencyPair: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> {
  return redisSet(exchangeRateKey(currencyPair), value, ttlSeconds);
}

/** Placeholder: Loan eligibility rules. TTL 1h when implemented. */
export async function getCachedLoanRules(): Promise<unknown | null> {
  return redisGet(loanRulesKey());
}

/** Placeholder: Set loan rules (for future config). */
export async function setCachedLoanRules(
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> {
  return redisSet(loanRulesKey(), value, ttlSeconds);
}

/** Placeholder: User session data. Full implementation requires custom NextAuth adapter. */
export async function getCachedSession(sessionId: string): Promise<unknown | null> {
  return redisGet(sessionKey(sessionId));
}

/** Placeholder: Set session (for future NextAuth Redis adapter). */
export async function setCachedSession(
  sessionId: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  return redisSet(sessionKey(sessionId), value, ttlSeconds);
}
