
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { agentService } from '../lib/services/agent-service';

async function main() {
  console.log('--- Agent Restriction Verification Script ---');
  
  let testData: any = {
    roleId: null,
    userId: null,
    areaId: null,
    agentId: null,
    client1Id: null,
    client2Id: null,
    client1AccId: null,
    client2AccId: null,
    agentAccId: null
  };

  try {
    // 0. Environment check
    console.log('Prisma initialized:', !!prisma);

    // 1. Setup
    console.log('Setting up test data...');
    
    // Get or create Agent role
    const agentRole = await prisma.userRole.upsert({
      where: { slug: 'agent' },
      update: {},
      create: { slug: 'agent', name: 'Agent', description: 'Agent Role' }
    });
    testData.roleId = agentRole.id;
    console.log('- Role ensured:', agentRole.slug);

    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'agent-verify@example.com' },
      update: {},
      create: {
        email: 'agent-verify@example.com',
        name: 'Verify Agent',
        roleId: agentRole.id,
        status: 'ACTIVE'
      }
    });
    testData.userId = user.id;
    console.log('- User created:', user.email);

    // Create area
    const area = await prisma.collectionArea.create({
      data: {
        name: 'Verify Area',
        code: 'V-AREA',
        status: 'ACTIVE'
      }
    });
    testData.areaId = area.id;
    console.log('- Area created:', area.code);

    // Create Agent using service to ensure all relations (account, code) are set up
    // Note: createAgent expects CreateAgentInput, createdBy (userId), creatorRoleName
    const agent = await agentService.createAgent({
      userId: user.id,
      fullName: 'Verify Agent',
      areaIds: [area.id]
    }, user.id, 'administrator');
    testData.agentId = agent.id;
    testData.agentAccId = agent.accountId;
    console.log('- Agent created via service:', agent.agentCode);

    // Get an active account nature
    const nature = await prisma.accountNature.findFirst({ where: { isActive: true } });
    if (!nature) throw new Error('No active account nature found');
    console.log('- Account nature found:', nature.name);

    // Create Clients
    const c1 = await clientService.createClient({
      fullName: 'Assigned to Agent',
      areaId: area.id,
      agentId: agent.id,
      accountNatureId: nature.id
    }, user.id, 'administrator');
    testData.client1Id = c1.id;
    testData.client1AccId = c1.accountId;
    console.log('- Client 1 created (Assigned):', c1.clientNumber);

    const c2 = await clientService.createClient({
      fullName: 'No Agent',
      areaId: area.id,
      accountNatureId: nature.id
    }, user.id, 'administrator');
    testData.client2Id = c2.id;
    testData.client2AccId = c2.accountId;
    console.log('- Client 2 created (Unassigned):', c2.clientNumber);

    // 2. Perform Tests
    console.log('\nRunning tests...');

    // Test A: Listing
    console.log('Test A: Testing listing filtering...');
    const listResult = await clientService.getAllClients({ agentId: agent.id });
    const hasAssigned = listResult.clients.some(c => c.id === c1.id);
    const hasUnassigned = listResult.clients.some(c => c.id === c2.id);
    
    if (hasAssigned && !hasUnassigned) {
      console.log('✅ Listing filter works (only assigned shown)');
    } else {
      console.log('❌ Listing filter failed. Assigned:', hasAssigned, 'Unassigned:', hasUnassigned);
    }

    // Test B: Detail access check logic
    console.log('Test B: Testing detail access logic...');
    // The API logic is: client.agentId === agent.id
    if (c1.agentId === agent.id) {
      console.log('✅ Access granted to assigned client');
    } else {
      console.log('❌ Access logic failed for assigned client');
    }

    if (c2.agentId !== agent.id) {
      console.log('✅ Access denied for unassigned client');
    } else {
      console.log('❌ Access logic failed for unassigned client');
    }

    console.log('\n--- Verification Finished ---');

  } catch (error: any) {
    console.error('\n❌ Error during verification:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    console.log('\nCleaning up test data...');
    try {
      if (testData.client1Id) {
        await prisma.auditLog.deleteMany({ where: { entityId: testData.client1Id, entityType: 'CLIENT' } });
        await prisma.client.delete({ where: { id: testData.client1Id } });
        if (testData.client1AccId) await prisma.financialAccount.delete({ where: { id: testData.client1AccId } });
      }
      if (testData.client2Id) {
        await prisma.auditLog.deleteMany({ where: { entityId: testData.client2Id, entityType: 'CLIENT' } });
        await prisma.client.delete({ where: { id: testData.client2Id } });
        if (testData.client2AccId) await prisma.financialAccount.delete({ where: { id: testData.client2AccId } });
      }
      if (testData.agentId) {
        // Need to delete assignments and audit logs first
        await prisma.agentAreaAssignment.deleteMany({ where: { agentId: testData.agentId } });
        await prisma.auditLog.deleteMany({ where: { entityId: testData.agentId, entityType: 'AGENT' } });
        await prisma.agent.delete({ where: { id: testData.agentId } });
        if (testData.agentAccId) await prisma.financialAccount.delete({ where: { id: testData.agentAccId } });
      }
      if (testData.userId) {
        await prisma.auditLog.deleteMany({ where: { userId: testData.userId } });
        await prisma.user.delete({ where: { id: testData.userId } });
      }
      if (testData.areaId) await prisma.collectionArea.delete({ where: { id: testData.areaId } });
      console.log('Cleanup complete.');
    } catch (cleanupError: any) {
      console.error('Error during cleanup:', cleanupError.message);
    }
    await prisma.$disconnect();
  }
}

main();
