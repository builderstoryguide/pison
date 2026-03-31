/**
 * Session Service
 * Handles daily session management and closures
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { redisGet, redisSet, redisDel } from '@/lib/cache/redis';
import {
  sessionStatusTodayKey,
  dashboardSurplusShortageSummaryKey,
} from '@/lib/cache/keys';
import { computeEffectiveClosureAt } from '@/lib/utils/effective-closure';
import { getDbNow, getDbCalendarDayStart } from '@/lib/utils/db-time';
import { transactionWhereForSessionDay } from '@/lib/utils/transaction-business-date';

const SESSION_STATUS_TTL = 30;

export interface DailyClosureInput {
  physicalCash: number;
  notes?: string;
}

export class SessionService {
  /**
   * Get current session (today's session)
   */
  async getCurrentSession() {
    const today = await getDbCalendarDayStart();

    return await prisma.dailySession.findUnique({
      where: {
        sessionDate: today,
      },
      include: {
        opener: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closure: true,
      },
    });
  }

  /**
   * Check if session is open
   */
  async isSessionOpen(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.status === 'OPEN' || false;
  }

  /**
   * Get full session status in a single optimized call.
   * Runs getCurrentSession and calculateSystemBalance in parallel,
   * derives isOpen from the session result, and caches the response.
   */
  async getSessionStatus(): Promise<{
    session: Awaited<ReturnType<SessionService['getCurrentSession']>>;
    isOpen: boolean;
    systemBalance: number;
    effectiveClosureAt: string | null;
    defaultDailyClosureTime: string;
    plannedClosureAt: string | null;
    timezone: string;
  }> {
    const cacheKey = sessionStatusTodayKey();
    const cached = await redisGet<{
      session: Awaited<ReturnType<SessionService['getCurrentSession']>>;
      isOpen: boolean;
      systemBalance: number;
      effectiveClosureAt: string | null;
      defaultDailyClosureTime: string;
      plannedClosureAt: string | null;
      timezone: string;
    }>(cacheKey);
    if (cached) return cached;

    const [currentSession, systemBalance, settings] = await Promise.all([
      this.getCurrentSession(),
      this.calculateSystemBalance(),
      prisma.systemSetting.findFirst({
        select: {
          defaultDailyClosureTime: true,
          timezone: true,
        },
      }),
    ]);

    const isOpen = currentSession?.status === 'OPEN' || false;
    const tz = settings?.timezone?.trim() || 'UTC';
    const defaultDailyClosureTime = settings?.defaultDailyClosureTime?.trim() || '18:00';
    const planned = currentSession?.plannedClosureAt ?? null;
    const effective = currentSession?.sessionDate
      ? computeEffectiveClosureAt(
          currentSession.sessionDate,
          planned,
          defaultDailyClosureTime,
          tz
        )
      : null;

    const result = {
      session: currentSession,
      isOpen,
      systemBalance,
      effectiveClosureAt: effective ? effective.toISOString() : null,
      defaultDailyClosureTime,
      plannedClosureAt: planned ? planned.toISOString() : null,
      timezone: tz,
    };
    await redisSet(cacheKey, result, SESSION_STATUS_TTL);
    return result;
  }

  /**
   * Manager: set or clear today's planned closure override (UTC stored).
   */
  async setPlannedClosure(plannedClosureAt: Date | null, userId: string) {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('No session found for today. Open a session first.');
    }
    if (session.status !== 'OPEN') {
      throw new Error('Session is not open; planned closure cannot be set.');
    }
    await prisma.dailySession.update({
      where: { id: session.id },
      data: { plannedClosureAt },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: plannedClosureAt ? 'SET_PLANNED_CLOSURE' : 'CLEAR_PLANNED_CLOSURE',
        entityType: 'DAILY_SESSION',
        entityId: session.id,
        description: plannedClosureAt
          ? `Planned closure set to ${plannedClosureAt.toISOString()}`
          : 'Planned closure override cleared',
      },
    });
    await this.invalidateSessionStatusCache();
    return this.getCurrentSession();
  }

  /**
   * Invalidate the session status cache (call after open/close).
   */
  async invalidateSessionStatusCache(): Promise<void> {
    await redisDel(sessionStatusTodayKey());
  }

  /**
   * Open a new session for today
   */
  async openSession(userId: string) {
    const today = await getDbCalendarDayStart();

    // Check if session already exists
    const existing = await prisma.dailySession.findUnique({
      where: {
        sessionDate: today,
      },
    });

    if (existing) {
      if (existing.status === 'OPEN') {
        throw new Error('Session is already open');
      }
      // If closed, reopen it
      const reopenedAt = await getDbNow();
      const updated = await prisma.dailySession.update({
        where: { id: existing.id },
        data: {
          status: 'OPEN',
          openedBy: userId,
          openedAt: reopenedAt,
          closedAt: null,
          closedBy: null,
        },
      });
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'OPEN_SESSION',
          entityType: 'DAILY_SESSION',
          entityId: existing.id,
          description: 'Daily session reopened',
        },
      });
      await this.invalidateSessionStatusCache();
      return updated;
    }

    const session = await prisma.dailySession.create({
      data: {
        sessionDate: today,
        status: 'OPEN',
        openedBy: userId,
      },
      include: {
        opener: {
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
        userId,
        action: 'OPEN_SESSION',
        entityType: 'DAILY_SESSION',
        entityId: session.id,
        description: 'Daily session opened',
      },
    });
    await this.invalidateSessionStatusCache();
    return session;
  }

  /**
   * Calculate system balance (sum of all account balances)
   */
  async calculateSystemBalance(): Promise<number> {
    const result = await prisma.financialAccount.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        status: 'ACTIVE',
      },
    });

    return result._sum.balance?.toNumber() || 0;
  }

  /**
   * Calculate totals for the day
   */
  /**
   * Totals for a daily session: uses linked transactions when present, else legacy createdAt window.
   */
  async calculateDayTotals(
    session: { id: string; sessionDate: Date },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;
    const dayWhere = transactionWhereForSessionDay(session.id, session.sessionDate);

    const [collections, withdrawals, deposits] = await Promise.all([
      db.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'COLLECTION',
          status: 'COMPLETED',
          ...dayWhere,
        },
      }),
      db.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          ...dayWhere,
        },
      }),
      db.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          ...dayWhere,
        },
      }),
    ]);

    return {
      totalCollections: collections._sum.amount?.toNumber() || 0,
      totalWithdrawals: withdrawals._sum.amount?.toNumber() || 0,
      totalDeposits: deposits._sum.amount?.toNumber() || 0,
    };
  }

  /**
   * Calculate surplus/shortage
   */
  async calculateSurplusShortage(physicalCash: number): Promise<number> {
    const systemBalance = await this.calculateSystemBalance();
    return physicalCash - systemBalance;
  }

  /**
   * Close daily session
   */
  async closeSession(data: DailyClosureInput, userId: string) {
    const session = await this.getCurrentSession();

    if (!session) {
      throw new Error('No session found for today. Please open a session first.');
    }

    if (session.status !== 'OPEN') {
      throw new Error(`Session is not open. Current status: ${session.status}`);
    }

    // Check if there are pending transactions
    const pendingCount = await prisma.transaction.count({
      where: {
        status: 'PENDING_APPROVAL',
        ...transactionWhereForSessionDay(session.id, session.sessionDate),
      },
    });

    if (pendingCount > 0) {
      throw new Error(`Cannot close session. There are ${pendingCount} pending transactions that need approval.`);
    }

    const closureDate = new Date(session.sessionDate);
    closureDate.setHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
      // Calculate day totals
      const totals = await this.calculateDayTotals(session, tx);
      const systemBalance = await this.calculateSystemBalance();
      const surplusShortage = data.physicalCash - systemBalance;

      const closedAt = await getDbNow(tx);

      // Create closure record
      const closure = await tx.dailyClosure.create({
        data: {
          sessionId: session.id,
          closureDate,
          totalCollections: totals.totalCollections,
          totalWithdrawals: totals.totalWithdrawals,
          totalDeposits: totals.totalDeposits,
          physicalCash: data.physicalCash,
          systemBalance,
          surplusShortage,
          notes: data.notes,
          closedBy: userId,
        },
      });

      // Update session status
      await tx.dailySession.update({
        where: { id: session.id },
        data: {
          status: 'CLOSED',
          closedBy: userId,
          closedAt,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CLOSE_SESSION',
          entityType: 'DAILY_SESSION',
          entityId: session.id,
          description: `Daily session closed. Surplus/Shortage: ${surplusShortage >= 0 ? '+' : ''}${surplusShortage}`,
        },
      });

      await this.invalidateSessionStatusCache();
      await redisDel(dashboardSurplusShortageSummaryKey());
      return closure;
    });
  }

  /**
   * Get session history
   */
  async getSessionHistory(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.sessionDate = {};
      if (startDate) {
        where.sessionDate.gte = startDate;
      }
      if (endDate) {
        where.sessionDate.lte = endDate;
      }
    }

    return await prisma.dailySession.findMany({
      where,
      include: {
        opener: {
          select: {
            name: true,
          },
        },
        closer: {
          select: {
            name: true,
          },
        },
        closure: true,
      },
      orderBy: { sessionDate: 'desc' },
    });
  }
}

export const sessionService = new SessionService();
