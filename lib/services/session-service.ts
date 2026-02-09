/**
 * Session Service
 * Handles daily session management and closures
 */

import { prisma } from '@/lib/prisma';

export interface DailyClosureInput {
  physicalCash: number;
  notes?: string;
}

export class SessionService {
  /**
   * Get current session (today's session)
   */
  async getCurrentSession() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
   * Open a new session for today
   */
  async openSession(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      return await prisma.dailySession.update({
        where: { id: existing.id },
        data: {
          status: 'OPEN',
          openedBy: userId,
          openedAt: new Date(),
          closedAt: null,
          closedBy: null,
        },
      });
    }

    return await prisma.dailySession.create({
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
  async calculateDayTotals(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [collections, withdrawals, deposits] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'COLLECTION',
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
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
        createdAt: {
          gte: session.sessionDate,
        },
      },
    });

    if (pendingCount > 0) {
      throw new Error(`Cannot close session. There are ${pendingCount} pending transactions that need approval.`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
      // Calculate day totals
      const totals = await this.calculateDayTotals(today);
      const systemBalance = await this.calculateSystemBalance();
      const surplusShortage = data.physicalCash - systemBalance;

      // Create closure record
      const closure = await tx.dailyClosure.create({
        data: {
          sessionId: session.id,
          closureDate: today,
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
          closedAt: new Date(),
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
