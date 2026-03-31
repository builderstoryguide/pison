/**
 * Single source of truth for wall-clock time: PostgreSQL server.
 * Avoids skew between app host and database for financial timestamps.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type DbClient = Prisma.TransactionClient | typeof prisma;

function clientOrPrisma(tx?: Prisma.TransactionClient): DbClient {
  return tx ?? prisma;
}

/**
 * Current timestamp from the database (NOW()).
 */
export async function getDbNow(tx?: Prisma.TransactionClient): Promise<Date> {
  const c = clientOrPrisma(tx);
  const rows = await c.$queryRaw<[{ now: Date }]>`
    SELECT NOW() AS now
  `;
  return rows[0].now;
}

/**
 * Start of the current calendar day in the database session timezone.
 */
export async function getDbCalendarDayStart(tx?: Prisma.TransactionClient): Promise<Date> {
  const c = clientOrPrisma(tx);
  const rows = await c.$queryRaw<[{ day_start: Date }]>`
    SELECT date_trunc('day', CURRENT_TIMESTAMP) AS day_start
  `;
  return rows[0].day_start;
}

/**
 * [start, endExclusive) for the current calendar day in the DB session timezone.
 */
export async function getDbCalendarDayBounds(tx?: Prisma.TransactionClient): Promise<{
  start: Date;
  endExclusive: Date;
}> {
  const c = clientOrPrisma(tx);
  const rows = await c.$queryRaw<[{ start: Date; end_exclusive: Date }]>`
    SELECT date_trunc('day', CURRENT_TIMESTAMP) AS start,
           date_trunc('day', CURRENT_TIMESTAMP) + interval '1 day' AS end_exclusive
  `;
  return { start: rows[0].start, endExclusive: rows[0].end_exclusive };
}

/** YYYYMMDD prefix for transaction numbers, aligned with DB clock. */
export function transactionNumberDatePrefix(dbNow: Date): string {
  return dbNow.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Active daily session for the DB calendar day, if any.
 */
export async function getOpenDailySessionIdForDbToday(
  tx?: Prisma.TransactionClient,
): Promise<string | null> {
  const dayStart = await getDbCalendarDayStart(tx);
  const c = clientOrPrisma(tx);
  const session = await c.dailySession.findFirst({
    where: { sessionDate: dayStart, status: 'OPEN' },
    select: { id: true },
  });
  return session?.id ?? null;
}
