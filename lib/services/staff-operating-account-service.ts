import { Prisma, PrismaClient } from '@prisma/client';
import { getDbNow, transactionNumberDatePrefix } from '@/lib/utils/db-time';

export type StaffAccountType = 'MANAGER' | 'ACCOUNTANT';

type DbClient = PrismaClient | Prisma.TransactionClient;

async function generateUniqueStaffAccountNumber(
  type: StaffAccountType,
  tx: DbClient,
): Promise<string> {
  const prefix = type === 'MANAGER' ? 'MGR' : 'ACC';
  const dateStr = transactionNumberDatePrefix(await getDbNow(tx));
  for (let i = 0; i < 15; i++) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const num = `ACC-${prefix}-${dateStr}-${random}`;
    const exists = await tx.financialAccount.findUnique({ where: { accountNumber: num } });
    if (!exists) return num;
  }
  throw new Error('Unable to generate unique staff account number');
}

/**
 * Ensures a user has a linked operating FinancialAccount (manager / accountant wallets).
 * Idempotent: returns existing operatingAccountId if already set.
 */
export async function ensureStaffOperatingAccount(
  client: DbClient,
  userId: string,
  staffAccountType: StaffAccountType,
): Promise<string> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, operatingAccountId: true },
  });
  if (!user) throw new Error('User not found');
  if (user.operatingAccountId) return user.operatingAccountId;

  const accountNumber = await generateUniqueStaffAccountNumber(staffAccountType, client);
  const account = await client.financialAccount.create({
    data: {
      accountNumber,
      accountType: staffAccountType,
      balance: new Prisma.Decimal(0),
      availableBalance: new Prisma.Decimal(0),
      status: 'ACTIVE',
    },
  });
  await client.user.update({
    where: { id: userId },
    data: { operatingAccountId: account.id },
  });
  return account.id;
}

export function staffAccountTypeForRoleSlug(roleSlug: string | undefined | null): StaffAccountType | null {
  const s = (roleSlug || '').toLowerCase();
  if (s === 'manager') return 'MANAGER';
  if (s === 'accountant') return 'ACCOUNTANT';
  return null;
}
