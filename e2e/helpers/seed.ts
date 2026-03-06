import { PrismaClient, UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import path from 'path';

// Ensure env vars are loaded
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
}

// #region agent log
// fetch('http://127.0.0.1:7243/ingest/2646fe79-66c2-4061-bac2-d73445eb31a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'e2e/helpers/seed.ts:5',message:'Before PrismaClient init',data:{envDbUrl:process.env.DATABASE_URL, cwd: process.cwd()},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const prisma = new PrismaClient();

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
  await prisma.user.deleteMany({
    where: { email },
  });
}
