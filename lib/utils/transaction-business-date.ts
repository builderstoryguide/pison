/**
 * Filters for attributing transactions to a business / reporting window.
 * Prefers immutable dailySession.sessionDate when dailySessionId is set;
 * falls back to createdAt for legacy rows.
 */

import type { Prisma } from '@prisma/client';

/**
 * Half-open window [rangeStart, rangeEndExclusive) — use with DB day bounds.
 */
export function transactionWhereBusinessWindow(
  rangeStart: Date,
  rangeEndExclusive: Date,
): Prisma.TransactionWhereInput {
  return {
    OR: [
      {
        dailySession: {
          sessionDate: {
            gte: rangeStart,
            lt: rangeEndExclusive,
          },
        },
      },
      {
        AND: [
          { dailySessionId: null },
          {
            createdAt: {
              gte: rangeStart,
              lt: rangeEndExclusive,
            },
          },
        ],
      },
    ],
  };
}

/**
 * Inclusive calendar range for reports (start 00:00, end 23:59:59 local interpretation from caller).
 */
export function transactionWhereBusinessInclusiveRange(
  start: Date,
  end: Date,
): Prisma.TransactionWhereInput {
  return {
    OR: [
      {
        dailySession: {
          sessionDate: {
            gte: start,
            lte: end,
          },
        },
      },
      {
        AND: [{ dailySessionId: null }, { createdAt: { gte: start, lte: end } }],
      },
    ],
  };
}

/**
 * Transactions tied to a specific closed/open session day, with legacy fallback for that calendar day.
 */
export function transactionWhereForSessionDay(
  sessionId: string,
  sessionCalendarDate: Date,
): Prisma.TransactionWhereInput {
  const startOfDay = new Date(sessionCalendarDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(sessionCalendarDate);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    OR: [
      { dailySessionId: sessionId },
      {
        AND: [
          { dailySessionId: null },
          { createdAt: { gte: startOfDay, lte: endOfDay } },
        ],
      },
    ],
  };
}
