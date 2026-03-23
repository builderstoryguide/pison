/**
 * System user for automated operations (commission cron, etc.).
 * Must exist in DB (created by seed-microfinance). Use system@dcm.local.
 */

import { prisma } from '@/lib/prisma';

const SYSTEM_USER_EMAIL = 'system@dcm.local';

let cachedSystemUserId: string | null = null;

/**
 * Get the system user ID for automated operations.
 * Throws if the system user does not exist (run seed:microfinance).
 */
export async function getSystemUserId(): Promise<string> {
  if (cachedSystemUserId) return cachedSystemUserId;
  const user = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error(
      `System user (${SYSTEM_USER_EMAIL}) not found. Run: npm run seed:microfinance`
    );
  }
  cachedSystemUserId = user.id;
  return cachedSystemUserId;
}
