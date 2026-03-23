/**
 * Dashboard Service
 * Server-side stats for dashboard - used by API route and server components
 */

import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { agentService } from '@/lib/services/agent-service';
import { redisGet, redisSet } from '@/lib/cache/redis';
import {
  userTransactionsRecentKey,
  adminTransactionsRecentKey,
  dashboardAdminStatsKey,
  dashboardAgentStatsKey,
  dashboardSurplusShortageSummaryKey,
} from '@/lib/cache/keys';
import { hasPermission } from '@/lib/auth';
import { getBalanceForUser } from '@/lib/cache/balance-cache';
import { getCachedQuery, setCachedQuery } from '@/lib/cache/query-cache';

const RECENT_TXN_TTL = 300;
const DASHBOARD_STATS_TTL = 300;
const SURPLUS_SHORTAGE_SUMMARY_TTL = 300;

type CachedDashboardStats = AdminDashboardStats | AgentDashboardStats;

function reviveDates(stats: CachedDashboardStats): CachedDashboardStats {
  return {
    ...stats,
    recentTransactions: stats.recentTransactions.map((t) => ({
      ...t,
      date: t.date instanceof Date ? t.date : new Date(t.date as unknown as string),
    })),
  };
}

function serializeForCache(stats: CachedDashboardStats): Record<string, unknown> {
  return {
    ...stats,
    recentTransactions: stats.recentTransactions.map((t) => ({
      ...t,
      date: t.date instanceof Date ? t.date.toISOString() : t.date,
    })),
  };
}

async function getSurplusShortageSummary(): Promise<{
  shortageDays: number;
  surplusDays: number;
  totalShortage: number;
  totalSurplus: number;
  periodDays: number;
}> {
  const cacheKey = dashboardSurplusShortageSummaryKey();
  const cached = await getCachedQuery<{
    shortageDays: number;
    surplusDays: number;
    totalShortage: number;
    totalSurplus: number;
    periodDays: number;
  }>(cacheKey);
  if (cached) return cached;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const closures = await prisma.dailyClosure.findMany({
    where: { closureDate: { gte: start, lte: end } },
  });

  let shortageDays = 0;
  let surplusDays = 0;
  let totalShortage = 0;
  let totalSurplus = 0;

  for (const c of closures) {
    const val = c.surplusShortage.toNumber();
    if (val < 0) {
      shortageDays++;
      totalShortage += Math.abs(val);
    } else if (val > 0) {
      surplusDays++;
      totalSurplus += val;
    }
  }

  const summary = {
    shortageDays,
    surplusDays,
    totalShortage,
    totalSurplus,
    periodDays: closures.length,
  };
  await setCachedQuery(cacheKey, summary, SURPLUS_SHORTAGE_SUMMARY_TTL);
  return summary;
}

async function enrichAdminStatsWithSurplusSummary(
  stats: AdminDashboardStats,
  session: Session | null
): Promise<AdminDashboardStats> {
  if (!hasPermission(session, 'reports.surplus_shortage')) {
    return stats;
  }
  const summary = await getSurplusShortageSummary();
  return { ...stats, surplusShortageSummary: summary };
}

export interface AdminDashboardStats {
  activeClients: number;
  activeAgents: number;
  totalLoans: number;
  pendingLoans: number;
  dailyCollections: number;
  activeAreas: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: Date;
    description?: string;
    reference?: string;
  }>;
  surplusShortageSummary?: {
    shortageDays: number;
    surplusDays: number;
    totalShortage: number;
    totalSurplus: number;
    periodDays: number;
  };
}

export interface AgentDashboardStats {
  assignedClientsCount: number;
  assignedAreasCount: number;
  dailyCollections: number;
  balance?: number;
  availableBalance?: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: Date;
    description?: string;
    reference?: string;
  }>;
}

export async function getDashboardStats(
  session: Session | null
): Promise<AdminDashboardStats | AgentDashboardStats | null> {
  if (!session?.user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const roleName = (session.user.roleName ?? '').toLowerCase();
  const isAgent = roleName.includes('agent') || roleName.includes('collector');

  if (isAgent && session.user.id) {
    const agent = await agentService.getAgentByUserId(session.user.id);
    if (!agent) {
      return {
        assignedClientsCount: 0,
        assignedAreasCount: 0,
        dailyCollections: 0,
        recentTransactions: [],
      };
    }

    const dashboardCacheKey = dashboardAgentStatsKey(session.user.id);
    const cachedFull = await getCachedQuery<Record<string, unknown>>(dashboardCacheKey);
    if (cachedFull) {
      return reviveDates(cachedFull as AgentDashboardStats);
    }

    const agentAreaIds = agent.areaAssignments?.map((a) => a.areaId) ?? [];

    const cacheKey = userTransactionsRecentKey(session.user.id);
    const cachedRecent = await redisGet<
      Array<{ id: string; type: string; amount: number; status: string; date: string; description?: string; reference?: string }>
    >(cacheKey);
    if (cachedRecent) {
      const [assignedClientsCount, assignedAreasCount, dailyCollectionsAgg, balanceData] =
        await Promise.all([
          agentAreaIds.length > 0
            ? prisma.client.count({
                where: {
                  status: 'ACTIVE',
                  areaId: { in: agentAreaIds },
                },
              })
            : 0,
          prisma.agentAreaAssignment.count({ where: { agentId: agent.id } }),
          prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
              type: 'COLLECTION',
              status: 'COMPLETED',
              agentId: agent.id,
              createdAt: { gte: today, lt: tomorrow },
            },
          }),
          getBalanceForUser(session.user.id),
        ]);
      return {
        assignedClientsCount,
        assignedAreasCount,
        dailyCollections: dailyCollectionsAgg._sum.amount?.toNumber() || 0,
        balance: balanceData?.balance,
        availableBalance: balanceData?.availableBalance,
        recentTransactions: cachedRecent.map((t) => ({
          ...t,
          date: new Date(t.date),
        })),
      };
    }

    const [
      assignedClientsCount,
      assignedAreasCount,
      dailyCollectionsAgg,
      recentCollectionTxns,
      balanceData,
    ] = await Promise.all([
      agentAreaIds.length > 0
        ? prisma.client.count({
            where: {
              status: 'ACTIVE',
              areaId: { in: agentAreaIds },
            },
          })
        : 0,
      prisma.agentAreaAssignment.count({ where: { agentId: agent.id } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'COLLECTION',
          status: 'COMPLETED',
          agentId: agent.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          type: 'COLLECTION',
          agentId: agent.id,
        },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
          description: true,
          account: {
            select: {
              client: { select: { fullName: true } },
              agent: { select: { fullName: true } },
            },
          },
        },
      }),
      getBalanceForUser(session.user.id),
    ]);

    const recentTransactions = recentCollectionTxns.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      status: t.status,
      date: t.createdAt,
      description: t.description ?? undefined,
      reference:
        t.account.client?.fullName || t.account.agent?.fullName || 'System',
    }));
    await redisSet(
      cacheKey,
      recentTransactions.map((t) => ({ ...t, date: t.date.toISOString() })),
      RECENT_TXN_TTL
    );

    const agentStats: AgentDashboardStats = {
      assignedClientsCount,
      assignedAreasCount,
      dailyCollections: dailyCollectionsAgg._sum.amount?.toNumber() || 0,
      balance: balanceData?.balance,
      availableBalance: balanceData?.availableBalance,
      recentTransactions,
    };
    await setCachedQuery(dashboardCacheKey, serializeForCache(agentStats), DASHBOARD_STATS_TTL);
    return agentStats;
  }

  // Admin / Accountant: global stats (include recentTransactions in parallel)
  const dashboardCacheKey = dashboardAdminStatsKey();
  const cachedFull = await getCachedQuery<Record<string, unknown>>(dashboardCacheKey);
  if (cachedFull) {
    const revived = reviveDates(cachedFull as AdminDashboardStats);
    return enrichAdminStatsWithSurplusSummary(revived, session);
  }

  const adminCacheKey = adminTransactionsRecentKey();
  const cachedAdminRecent = await redisGet<
    Array<{ id: string; type: string; amount: number; status: string; date: string; description?: string; reference?: string }>
  >(adminCacheKey);
  if (cachedAdminRecent) {
    const [
      activeClients,
      activeAgents,
      totalLoans,
      pendingLoans,
      dailyCollections,
      activeAreas,
    ] = await Promise.all([
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.agent.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({ where: { status: { in: ['ACTIVE', 'DISBURSED'] } } }),
      prisma.loan.count({ where: { status: 'PENDING' } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'COLLECTION',
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.collectionArea.count({ where: { status: 'ACTIVE' } }),
    ]);
    const adminStats: AdminDashboardStats = {
      activeClients,
      activeAgents,
      totalLoans,
      pendingLoans,
      dailyCollections: dailyCollections._sum.amount?.toNumber() || 0,
      activeAreas,
      recentTransactions: cachedAdminRecent.map((t) => ({
        ...t,
        date: new Date(t.date),
      })),
    };
    await setCachedQuery(dashboardCacheKey, serializeForCache(adminStats), DASHBOARD_STATS_TTL);
    return enrichAdminStatsWithSurplusSummary(adminStats, session);
  }

  const [
    activeClients,
    activeAgents,
    totalLoans,
    pendingLoans,
    dailyCollections,
    activeAreas,
    recentTransactions,
  ] = await Promise.all([
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.agent.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: { in: ['ACTIVE', 'DISBURSED'] } } }),
    prisma.loan.count({ where: { status: 'PENDING' } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'COLLECTION',
        status: 'COMPLETED',
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.collectionArea.count({ where: { status: 'ACTIVE' } }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true,
        description: true,
        account: {
          select: {
            client: { select: { fullName: true } },
            agent: { select: { fullName: true } },
          },
        },
      },
    }),
  ]);

  const recentTxnsMapped = recentTransactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toNumber(),
    status: t.status,
    date: t.createdAt,
    description: t.description ?? undefined,
    reference:
      t.account.client?.fullName || t.account.agent?.fullName || 'System',
  }));
  await redisSet(
    adminCacheKey,
    recentTxnsMapped.map((t) => ({ ...t, date: t.date.toISOString() })),
    RECENT_TXN_TTL
  );

  const adminStats: AdminDashboardStats = {
    activeClients,
    activeAgents,
    totalLoans,
    pendingLoans,
    dailyCollections: dailyCollections._sum.amount?.toNumber() || 0,
    activeAreas,
    recentTransactions: recentTxnsMapped,
  };
  await setCachedQuery(dashboardCacheKey, serializeForCache(adminStats), DASHBOARD_STATS_TTL);
  return enrichAdminStatsWithSurplusSummary(adminStats, session);
}
