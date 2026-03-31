
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { agentService } from '../lib/services/agent-service';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { sessionService } from '../lib/services/session-service';

async function main() {
  console.log('🚀 Starting Ventilation Flow Verification...');

  try {
    // 1. Setup Data (Area, Agent, Client)
    console.log('\n--- 1. Setup ---');
    const agentEmail = 'agent-flow@verify.local';
    
    // Cleanup first
    await cleanup(agentEmail);

    // Create Agent User & Role
    const agentRole = await prisma.userRole.upsert({
        where: { slug: 'agent' },
        update: {},
        create: { slug: 'agent', name: 'Agent', description: 'Agent' }
    });
    const agentUser = await prisma.user.create({
        data: { email: agentEmail, name: 'Agent Flow', roleId: agentRole.id, status: 'ACTIVE' }
    });

    // Create Area
    const area = await prisma.collectionArea.create({
        data: { code: 'FLOW-AREA', name: 'Flow Area', status: 'ACTIVE' }
    });

    // Create Agent Account (funded so ventilation debit can be reserved pending approval)
    const agentAccount = await prisma.financialAccount.create({
      data: {
        accountNumber: 'ACC-AGT-FLOW',
        accountType: 'AGENT',
        status: 'ACTIVE',
        balance: 10000,
        availableBalance: 10000,
      },
    });

    // Create Agent Profile
    const agent = await prisma.agent.create({
        data: {
            userId: agentUser.id,
            fullName: 'Agent Flow',
            agentCode: 'AGT-FLOW',
            status: 'ACTIVE',
            accountId: agentAccount.id,
            areaAssignments: { create: { areaId: area.id, isPrimary: true } }
        }
    });

    // Create Client
    const client = await clientService.createClient({
        fullName: 'Client Flow',
        areaId: area.id,
        agentId: agent.id,
    }, agentUser.id);
    
    // Manually approve client and create account (since default is PENDING)
    await prisma.client.update({ where: { id: client.id }, data: { status: 'ACTIVE' } });
    const clientAccount = await prisma.financialAccount.create({ 
        data: { 
            accountNumber: 'ACC-CLI-FLOW',
            accountType: 'CLIENT', 
            status: 'ACTIVE' 
        } 
    });
    await prisma.client.update({ where: { id: client.id }, data: { accountId: clientAccount.id } });

    // Open Session
    await sessionService.openSession(agentUser.id).catch(() => {});

    console.log('✅ Setup Complete');


    // 2. Mimic Frontend: Fetch Agent Data
    console.log('\n--- 2. Frontend: Fetch Agent Data ---');
    const fetchedAgent = await agentService.getAgentByUserId(agentUser.id);
    if (!fetchedAgent) throw new Error('Agent not found for user');
    console.log(`✅ Fetched Agent: ${fetchedAgent.fullName}`);


    // 3. Mimic Frontend: Fetch Assigned Areas
    console.log('\n--- 3. Frontend: Fetch Assigned Areas ---');
    const assignedAreas = await agentService.getAgentAreas(fetchedAgent.id);
    if (assignedAreas.length === 0) throw new Error('No areas found for agent');
    const selectedArea = assignedAreas[0];
    console.log(`✅ Fetched Areas: Found ${selectedArea.name}`);


    // 4. Mimic Frontend: Fetch Clients in Area
    console.log('\n--- 4. Frontend: Fetch Clients in Area ---');
    const areaClientsResponse = await clientService.getAllClients({ areaId: selectedArea.id, status: 'ACTIVE' });
    const areaClients = areaClientsResponse.clients;
    const targetClient = areaClients.find(c => c.id === client.id);
    if (!targetClient) throw new Error('Target client not found in area');
    console.log(`✅ Fetched Clients: Found ${targetClient.fullName}`);


    // 5. Mimic Frontend: Submit Collection
    console.log('\n--- 5. Frontend: Submit Collection ---');
    const collectionAmount = 2500;
    
    // Construct payload strictly matching UI/API Zod Schema
    const payload = {
        areaId: selectedArea.id,
        agentId: fetchedAgent.id,
        entries: [
            {
                clientId: targetClient.id,
                amount: collectionAmount, // number
                description: 'Ventilation Flow Test'
            }
        ]
    };

    // Call Service (mimicking API handler)
    const result = await transactionService.createCollectionEntries(payload, agentUser.id);

    if (result.length !== 2) throw new Error('Expected 2 transactions (payer debit + collection credit)');
    const ref = result[0].reference;
    if (!ref?.startsWith('ventilation-')) throw new Error('Expected ventilation batch reference');
    if (result[1].reference !== ref) throw new Error('Batch reference mismatch');
    const collectionTx = result.find((t) => t.type === 'COLLECTION');
    const payerTx = result.find((t) => t.type === 'WITHDRAWAL');
    if (!collectionTx || !payerTx) throw new Error('Expected WITHDRAWAL + COLLECTION legs');
    if (collectionTx.amount.toNumber() !== collectionAmount) throw new Error('Amount mismatch');

    console.log('✅ Collection Submitted Successfully');
    console.log(`Transactions Created: ${result.length}`);

    // 6. Verify Result (Receipt Data)
    console.log('\n--- 6. Verify Result ---');
    const tx = await prisma.transaction.findUnique({ where: { id: collectionTx.id } });
    if (tx?.status !== 'PENDING_APPROVAL') throw new Error('Transaction should be PENDING_APPROVAL');

    console.log('✅ Transaction Verified: Recorded and PENDING_APPROVAL');

    
    // 7. Cleanup
    console.log('\n--- 7. Cleanup ---');
    await cleanup(agentEmail);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Ventilation Flow Verified!');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

async function cleanup(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    await prisma.transaction.deleteMany({ where: { createdBy: user.id } });
    await prisma.client.deleteMany({ where: { createdBy: user.id } });
    // Audit logs/System logs linked to user
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.systemLog.deleteMany({ where: { userId: user.id } });
    
    await prisma.agent.deleteMany({ where: { userId: user.id } });
    await prisma.financialAccount.deleteMany({ where: { accountNumber: 'ACC-CLI-FLOW' } });
    await prisma.financialAccount.deleteMany({ where: { accountNumber: 'ACC-AGT-FLOW' } });
    await prisma.collectionArea.deleteMany({ where: { code: 'FLOW-AREA' } }); // clean by code
    await prisma.user.delete({ where: { id: user.id } });
}

main();
