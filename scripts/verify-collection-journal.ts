
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { agentService } from '../lib/services/agent-service';
import { transactionService } from '../lib/services/transaction-service';
import { reportService } from '../lib/services/report-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Collection Journal Verification...');

  const prefix = 'JOURNAL';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP ACTORS
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const agentRole = await ensureRole('agent', 'Agent', false);
    
    // Create Admin
    const adminUser = await createUser(adminEmail, 'Admin Journal', adminRole.id);
    
    // Create Agent
    const agentUser = await createUser(`agent-${prefix}@verify.local`, 'Agent Journal', agentRole.id);
    const agent = await agentService.createAgent({
        userId: agentUser.id,
        fullName: 'Agent Journal',
        email: agentUser.email,
        phone: '555666777',
        areaIds: []
    }, adminUser.id, 'manager');

    // Create Area
    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Journal Area', status: 'ACTIVE' }
    });
    
    // Assign Agent to Area
    await agentService.assignAreas(agent.id, [area.id], adminUser.id);

    // Create Client
    let client = await clientService.createClient({
        fullName: 'Client Journal',
        areaId: area.id,
        phone: '111222333',
    }, adminUser.id, 'manager');

    // Open Session
    await sessionService.openSession(adminUser.id).catch(() => {});

    console.log('✅ Setup Complete');


    // ============================================
    // 2. GENERATE COLLECTION TRANSACTIONS
    // ============================================
    console.log('\n--- 2. Generate Collections ---');
    
    // Transaction 1: Today, by Agent, in Area
    const t1 = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'COLLECTION',
        amount: 500,
        description: 'Journal Col 1',
        agentId: agent.id,
        areaId: area.id
    }, adminUser.id); // Simulating Admin entry on behalf of agent for simplicity
    
    // Auto-approve not strictly needed for journal unless status filter is applied, 
    // but reportService defaults to NO status filter in findMany? 
    // Wait, let's check code: `const where: Prisma.TransactionWhereInput = { type: 'COLLECTION' ... }`
    // It does NOT filter by status. So PENDING is fine.
    
    // Create a generic transaction to ensure filtering ignores non-collections
    await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Ignore me',
    }, adminUser.id);
    
    console.log('✅ Transactions Generated');


    // ============================================
    // 3. VERIFY REPORT FILTERS
    // ============================================
    console.log('\n--- 3. Verify Report Filters ---');

    const today = new Date().toISOString().slice(0, 10);
    
    // A. Basic Date Filter
    console.log(`[Filter] Date: ${today}`);
    const dateReport = await reportService.generateCollectionJournal({
        startDate: today,
        endDate: today
    });
    
    if (dateReport.length !== 1) throw new Error(`Expected 1 transaction, got ${dateReport.length}`);
    if (dateReport[0].amount !== 500) throw new Error('Amount mismatch');
    if (dateReport[0].agentName !== 'Agent Journal') throw new Error('Agent Name mismatch');
    
    console.log('✅ Date Filter Passed');
    
    // B. Agent Filter
    console.log(`[Filter] Agent: ${agent.id}`);
    const agentReport = await reportService.generateCollectionJournal({
        startDate: today,
        endDate: today,
        agentId: agent.id
    });
    
    if (agentReport.length !== 1) throw new Error('Agent filter failed');
    console.log('✅ Agent Filter Passed');
    
    // C. Area Filter
    console.log(`[Filter] Area: ${area.id}`);
    const areaReport = await reportService.generateCollectionJournal({
        startDate: today,
        endDate: today,
        areaId: area.id
    });
    
    if (areaReport.length !== 1) throw new Error('Area filter failed');
    console.log('✅ Area Filter Passed');

    // D. Verify Fields
    const row = dateReport[0];
    if (!row.clientName || !row.agentName || !row.amount || !row.date) {
         throw new Error('Missing required columns (Agent, Client, Amount, Date)');
    }
    console.log('✅ Column Verification Passed');


    // ============================================
    // 4. CLEANUP
    // ============================================
    console.log('\n--- 4. Cleanup ---');
    await cleanup(prefix);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Collection Journal Verification Passed!');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

async function ensureRole(slug: string, name: string, isProtected: boolean) {
    return await prisma.userRole.upsert({
        where: { slug },
        update: {},
        create: { slug, name, description: name, isProtected }
    });
}

async function createUser(email: string, name: string, roleId: string) {
    return await prisma.user.create({
        data: {
            email,
            name,
            password: await bcrypt.hash('password', 10),
            roleId,
            status: 'ACTIVE'
        }
    });
}

async function cleanup(prefix: string) {
    const users = await prisma.user.findMany({ where: { email: { contains: prefix } } });
    const userIds = users.map(u => u.id);
    if (userIds.length === 0) return;

    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } });
    
    // Find agents
    const agents = await prisma.agent.findMany({ where: { userId: { in: userIds } } });
    for (const a of agents) {
        await prisma.agentAreaAssignment.deleteMany({ where: { agentId: a.id } });
        await prisma.transaction.deleteMany({ where: { agentId: a.id } });
        await prisma.agent.delete({ where: { id: a.id } });
        await prisma.financialAccount.delete({ where: { id: a.accountId } });
    }

    await prisma.transaction.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.client.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.collectionArea.deleteMany({ where: { code: { contains: prefix } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

main();
