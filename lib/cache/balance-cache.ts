/**
 * User balance cache.
 * Key: user:balance:{userId}, TTL 60s.
 * Resolves User -> Agent/Client -> accountId -> balance.
 */

import { prisma } from '@/lib/prisma';
import { redisGet, redisSet } from './redis';
import { userBalanceKey } from './keys';

const BALANCE_TTL = 60;

export interface CachedBalance {
  balance: number;
  availableBalance: number;
}

/**
 * Get balance for a user (Agent or Client with userId).
 * Uses cache when Redis is available.
 */
export async function getBalanceForUser(
  userId: string
): Promise<CachedBalance | null> {
  const cached = await redisGet<CachedBalance>(userBalanceKey(userId));
  if (cached) return cached;

  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { accountId: true },
  });
  if (agent) {
    const account = await prisma.financialAccount.findUnique({
      where: { id: agent.accountId },
      select: { balance: true, availableBalance: true },
    });
    if (account) {
      const data: CachedBalance = {
        balance: account.balance.toNumber(),
        availableBalance: account.availableBalance.toNumber(),
      };
      await redisSet(userBalanceKey(userId), data, BALANCE_TTL);
      return data;
    }
  }

  const client = await prisma.client.findUnique({
    where: { userId },
    select: { accountId: true },
  });
  if (client) {
    const account = await prisma.financialAccount.findUnique({
      where: { id: client.accountId },
      select: { balance: true, availableBalance: true },
    });
    if (account) {
      const data: CachedBalance = {
        balance: account.balance.toNumber(),
        availableBalance: account.availableBalance.toNumber(),
      };
      await redisSet(userBalanceKey(userId), data, BALANCE_TTL);
      return data;
    }
  }

  return null;
}
