
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { agentService } from '../lib/services/agent-service';
import { transactionService } from '../lib/services/transaction-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Management Module Verification...');

  const prefix = 'MGMT';
  const adminEmail = `admin-${prefix}@verify.local`;
  const accountantEmail = `accountant-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP ACTORS
    // ============================================
    console.log('\n--- 1. Setup ---');
    
    // Create Roles
    const adminRole = await ensureRole('manager', 'Manager', true);
    const accountantRole = await ensureRole('accountant', 'Accountant', false);
    
    // Create Users
    const adminUser = await createUser(adminEmail, 'Admin Mgmt', adminRole.id);
    const accountantUser = await createUser(accountantEmail, 'Accountant Mgmt', accountantRole.id);

    // Create Collection Area
    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Management Area', status: 'ACTIVE' }
    });

    // Open Session (required for financial ops)
    await sessionService.openSession(adminUser.id).catch(() => {});

    console.log('✅ Actors and Environment Setup Complete');

    // ============================================
    // 2. CLIENT MANAGEMENT
    // ============================================
    console.log('\n--- 2. Client Management ---');

    console.log('[Create] Admin creating client...');
    let client = await clientService.createClient({
        fullName: 'Client To Manage',
        areaId: area.id,
        phone: '111222333',
    }, adminUser.id, 'manager'); // Manager creates APPROVED client

    if (client.approvalStatus !== 'APPROVED') throw new Error('Client created by Manager should be APPROVED');
    if (client.status !== 'ACTIVE') throw new Error('Client should be ACTIVE');
    console.log('✅ Client Created (Active)');

    console.log('[View] Administrator viewing list of all clients...');
    const allClients = await clientService.getAllClients({ limit: 100 });
    const foundClient = allClients.clients.find(c => c.id === client.id);
    if (!foundClient) throw new Error('Created client not found in list');
    console.log('✅ Client found in list');

    console.log('[Edit] Administrator editing client information...');
    const newName = 'Client Managed Updated';
    const updatedClient = await clientService.updateClient(client.id, {
        fullName: newName,
        phone: '999888777' 
    }, adminUser.id);
    
    if (updatedClient.fullName !== newName) throw new Error('Client name update failed');
    console.log('✅ Client Updated');

    console.log('[Deactivate] Administrator deactivating client account...');
    const deactivatedClient = await clientService.deactivateClient(client.id, adminUser.id);
    if (deactivatedClient.status !== 'INACTIVE') throw new Error('Client deactivation failed');
    console.log('✅ Client Deactivated');

    // ============================================
    // 3. AGENT MANAGEMENT
    // ============================================
    console.log('\n--- 3. Agent Management ---');

    console.log('[Create] Administrator adding new agent...');
    // Note: Agent creation usually involves creating a User first in the real UI flow, 
    // but here we simulate the service call which expects a userId.
    const agentUserRole = await ensureRole('agent', 'Agent', false);
    const agentUserAccount = await createUser(`agent-${prefix}@verify.local`, 'Agent To Manage', agentUserRole.id);
    
    let agent = await agentService.createAgent({
        userId: agentUserAccount.id,
        fullName: 'Agent To Manage',
        email: agentUserAccount.email,
        phone: '555666777',
        areaIds: [] // No area initially
    }, adminUser.id, 'manager');

    if (agent.approvalStatus !== 'APPROVED') throw new Error('Agent created by Manager should be APPROVED');
    console.log('✅ Agent Created');

    console.log('[View] Administrator viewing list of all agents...');
    const allAgents = await agentService.getAllAgents();
    const foundAgent = allAgents.find(a => a.id === agent.id);
    if (!foundAgent) throw new Error('Created agent not found in list');
    console.log('✅ Agent found in list');

    console.log('[Assign Area] Administrator assigning collection area...');
    const agentWithArea = await agentService.assignAreas(agent.id, [area.id], adminUser.id);
    const assignments = await agentService.getAgentAreas(agent.id);
    if (assignments.length !== 1 || assignments[0].id !== area.id) throw new Error('Area assignment failed');
    console.log('✅ Collection Area Assigned');

    console.log('[Edit] Administrator modifying agent details...');
    const newAgentName = 'Agent Managed Updated';
    const updatedAgent = await agentService.updateAgent(agent.id, {
        fullName: newAgentName
    }, adminUser.id);
    if (updatedAgent.fullName !== newAgentName) throw new Error('Agent update failed');
    console.log('✅ Agent Details Updated');

    console.log('[Refill] Administrator refilling agent account...');
    // This is a DEPOSIT into the AGENT account
    const refillAmount = 50000;
    
    // We need to fetch the agent's account ID. 
    // The agent object from createAgent includes account? Check service.
    // createAgent returns result of findUnique which includes account.
    if (!agent.accountId) throw new Error('Agent has no account ID');
    
    const depositTx = await transactionService.createTransaction({
        accountId: agent.accountId,
        type: 'DEPOSIT',
        amount: refillAmount,
        description: 'Agent Float Refill',
    }, adminUser.id); // Created by Admin

    // Auto-approve if needed (Admin created usually auto-approves? Check service logic)
    // transaction-service createTransaction status defaults to PENDING_APPROVAL.
    // Admin needs to approve it.
    await transactionService.approveTransaction(depositTx.id, adminUser.id);

    // Verify Balance
    const refilledAgent = await agentService.getAgentById(agent.id);
    // @ts-ignore
    const balance = refilledAgent?.account?.balance.toNumber();
    if (balance !== refillAmount) throw new Error(`Agent refill failed. Balance: ${balance}, Expected: ${refillAmount}`);
    console.log(`✅ Agent Account Refilled (Balance: ${balance})`);

    console.log('[Deactivate] Administrator deactivating agent...');
    const deactivatedAgent = await agentService.updateAgent(agent.id, { status: 'INACTIVE' }, adminUser.id);
    if (deactivatedAgent.status !== 'INACTIVE') throw new Error('Agent deactivation failed');
    console.log('✅ Agent Deactivated');


    // ============================================
    // 4. CLEANUP
    // ============================================
    console.log('\n--- 4. Cleanup ---');
    await cleanup(prefix);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Management Module Verification Passed!');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

// Helpers
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

    // Delete related data to satisfy FK constraints
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.transaction.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.client.deleteMany({ where: { createdBy: { in: userIds } } });
    
    // Delete Agents created by these users (userId is unique, so verify logic)
    // Agents are linked to Users 1:1. Only 'Agent To Manage' is an agent user.
    // But 'Admin Mgmt' created them.
    
    // Find agents linked to the users we are about to delete
    const agentUsers = await prisma.agent.findMany({ where: { userId: { in: userIds } } });
    for (const a of agentUsers) {
        // Delete agent area assignments
        await prisma.agentAreaAssignment.deleteMany({ where: { agentId: a.id } });
        // Delete agent transactions (if any)
        await prisma.transaction.deleteMany({ where: { agentId: a.id } });
        // Delete agent
        await prisma.agent.delete({ where: { id: a.id } });
        // Delete agent account
        await prisma.financialAccount.delete({ where: { id: a.accountId } });
    }

    await prisma.collectionArea.deleteMany({ where: { code: { contains: prefix } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

main();
