import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import path from 'path';

// Ensure env vars are loaded for E2E (uses .env.test)
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Run with: dotenv -e .env.test -- npx playwright test ...');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function createTestUser(roleSlug: string = 'agent') {
  const email = faker.internet.email();
  const username = `test_${Date.now()}_${faker.string.alphanumeric(6).toLowerCase()}`;
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const role = await prisma.userRole.findUnique({
    where: { slug: roleSlug },
  });

  if (!role) {
    throw new Error(`Role ${roleSlug} not found. Ensure DB is seeded.`);
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name: faker.person.fullName(),
      roleId: role.id,
      status: 'ACTIVE',
    },
  });

  return { ...user, password }; // Return plain password for login
}

export async function createCollectionArea() {
  return await prisma.collectionArea.create({
    data: {
      code: faker.string.alphanumeric(5).toUpperCase(),
      name: faker.location.city(),
      status: 'ACTIVE',
    },
  });
}

export async function createClient(areaId: string, createdByUserId: string) {
  const account = await prisma.financialAccount.create({
    data: {
      accountNumber: faker.finance.accountNumber(),
      accountType: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  return await prisma.client.create({
    data: {
      fullName: faker.person.fullName(),
      clientNumber: faker.string.numeric(8),
      areaId,
      accountId: account.id,
      createdBy: createdByUserId,
      status: 'ACTIVE',
    },
    include: { account: true },
  });
}

export async function unlockTestUser(email: string) {
  await prisma.user.updateMany({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export async function createAgent(userId: string, fullName: string, createdBy: string) {
  // Generate unique agent code
  const agentCode = `AGT-${Date.now()}-${faker.string.alphanumeric(3).toUpperCase()}`;
  
  // Create agent account
  const accountNumber = `ACC-AGT-${Date.now()}-${faker.string.numeric(3)}`;
  const account = await prisma.financialAccount.create({
    data: {
      accountNumber,
      accountType: 'AGENT',
      balance: 0,
      availableBalance: 0,
      status: 'ACTIVE',
    },
  });

  // Create agent
  return await prisma.agent.create({
    data: {
      agentCode,
      userId,
      fullName,
      accountId: account.id,
      status: 'ACTIVE',
      createdBy,
    },
  });
}

export async function assignAgentToArea(agentId: string, areaId: string, assignedBy?: string) {
  return await prisma.agentAreaAssignment.create({
    data: {
      agentId,
      areaId,
      isPrimary: true,
      assignedBy,
    },
  });
}

export async function cleanupTestUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // Delete Agent first (FK: Agent.userId -> User, RESTRICT)
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    select: { id: true, accountId: true },
  });
  for (const a of agents) {
    await prisma.agent.delete({ where: { id: a.id } });
    await prisma.financialAccount.delete({ where: { id: a.accountId } }).catch(() => {});
  }

  await prisma.user.deleteMany({ where: { email } });
}

/**
 * Open the daily session for today (required for collection/transaction tests).
 * Call with a manager/admin user ID.
 */
export async function openDailySession(openedByUserId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailySession.findUnique({
    where: { sessionDate: today },
  });

  if (existing) {
    if (existing.status === 'OPEN') {
      throw new Error('Session is already open');
    }
    return await prisma.dailySession.update({
      where: { id: existing.id },
      data: {
        status: 'OPEN',
        openedBy: openedByUserId,
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
      openedBy: openedByUserId,
    },
  });
}

/**
 * Get the first active account nature (for client creation tests).
 * Requires seed:account-natures to have been run.
 */
export async function getFirstAccountNature() {
  const nature = await prisma.accountNature.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (!nature) {
    throw new Error('No account nature found. Run npm run seed:account-natures first.');
  }
  return nature;
}
