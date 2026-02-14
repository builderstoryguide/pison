
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';

async function main() {
  try {
    // Cleanup any existing test data first
    await cleanup();

    console.log('Starting verification...');

    // 1. Setup: Create User, Role, Account, Area and Agent
    console.log('Setting up test data...');
    
    // Create Role
    const role = await prisma.userRole.upsert({
      where: { slug: 'agent' },
      update: {},
      create: {
        slug: 'agent',
        name: 'Agent',
        description: 'Agent Role',
      },
    });

    // Create User
    const user = await prisma.user.create({
      data: {
        email: 'test-agent-assign@example.com',
        name: 'Test Agent Assignment',
        roleId: role.id,
        status: 'ACTIVE',
      },
    });

    // Create Financial Account for Agent
    const agentAccount = await prisma.financialAccount.create({
      data: {
        accountNumber: 'ACC-AGT-TEST-ASSIGN',
        accountType: 'AGENT',
        status: 'ACTIVE',
      },
    });

    const area = await prisma.collectionArea.create({
      data: {
        name: 'Test Area Assignment',
        code: 'TEST-ASSIGN',
        status: 'ACTIVE',
        city: 'Test City',
      },
    });

    const agent = await prisma.agent.create({
      data: {
        fullName: 'Test Agent Assignment',
        email: 'test-agent-assign@example.com',
        phone: '1234567890',
        nationalId: 'TEST-ID-ASSIGN',
        agentCode: 'AGT-TEST-ASSIGN',
        status: 'ACTIVE',
        areaAssignments: {
          create: {
            areaId: area.id,
            isPrimary: true,
          }
        },
        userId: user.id,
        accountId: agentAccount.id,
      },
    });

    try {
      // 2. Test: Create Client with Agent Assignment
      console.log('Testing createClient with agentId...');
      const clientInput = {
        fullName: 'Test Client Assignment',
        areaId: area.id,
        agentId: agent.id,
        city: 'Test City',
        address: 'Test Address',
      };

      const client = await clientService.createClient(clientInput, user.id);
      console.log('Client created:', client.id, client.fullName);

      if (client.agentId !== agent.id) {
        throw new Error(`Client agentId mismatch. Expected ${agent.id}, got ${client.agentId}`);
      }
      console.log('✅ Client creation with agent assignment passed.');

      // 3. Test: Get Client by ID (check relation)
      console.log('Testing getClientById...');
      const fetchedClient = await clientService.getClientById(client.id);
      if (!fetchedClient?.assignedAgent) {
        throw new Error('Client assignedAgent relation missing');
      }
      if (fetchedClient.assignedAgent.id !== agent.id) {
        throw new Error('Client assignedAgent ID mismatch');
      }
      console.log('✅ getClientById with agent relation passed.');

      // 4. Test: Get All Clients filtered by Agent
      console.log('Testing getAllClients with agentId filter...');
      const agentsClients = await clientService.getAllClients({ agentId: agent.id });
      const found = agentsClients.find(c => c.id === client.id);
      if (!found) {
        throw new Error('Client not found when filtering by correct agentId');
      }
      console.log('✅ getAllClients with correct agentId passed.');

      // 5. Test: Get All Clients filtered by WRONG Agent
      console.log('Testing getAllClients with wrong agentId filter...');
      const otherAgentId = '00000000-0000-0000-0000-000000000000'; // Fake UUID
      const otherClients = await clientService.getAllClients({ agentId: otherAgentId });
      const foundInOther = otherClients.find(c => c.id === client.id);
      if (foundInOther) {
        throw new Error('Client found when filtering by WRONG agentId');
      }
      console.log('✅ getAllClients with wrong agentId passed.');

      // 6. Test: Update Client (Change Agent)
      console.log('Testing updateClient to unassign agent...');
      const updatedClient = await clientService.updateClient(client.id, { agentId: null }, user.id);
      if (updatedClient.agentId !== null) {
        throw new Error('Client agentId not cleared');
      }
      console.log('✅ updateClient to unassign agent passed.');

    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    // 7. Cleanup
    await cleanup();
  }
}

async function cleanup() {
  console.log('Cleaning up...');
  try {
      const client = await prisma.client.findFirst({ where: { fullName: 'Test Client Assignment' } });
      if (client) {
          await prisma.client.delete({ where: { id: client.id } });
          await prisma.financialAccount.delete({ where: { id: client.accountId } });
      }
      
      const agent = await prisma.agent.findUnique({ where: { agentCode: 'AGT-TEST-ASSIGN' } });
      if (agent) {
          await prisma.agent.delete({ where: { id: agent.id } });
      }

      const agentAccount = await prisma.financialAccount.findUnique({ where: { accountNumber: 'ACC-AGT-TEST-ASSIGN' } });
      if (agentAccount) {
          await prisma.financialAccount.delete({ where: { id: agentAccount.id } });
      }

      await prisma.user.deleteMany({ where: { email: 'test-agent-assign@example.com' } });

      const area = await prisma.collectionArea.findUnique({ where: { code: 'TEST-ASSIGN' } });
      if (area) {
          await prisma.collectionArea.delete({ where: { id: area.id } });
      }
  } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
  }
}

main();
