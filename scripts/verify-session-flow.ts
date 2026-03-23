import 'dotenv/config';
import { transactionService } from '../lib/services/transaction-service';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔍 Verifying Session Logic...\n');

  let testsPassed = true;

  try {
    // 1. Setup Data
    const manager = await prisma.user.findFirst({ where: { role: { slug: 'manager' } } });
    if (!manager) throw new Error('Manager not found');

    const client = await prisma.client.findFirst({ include: { account: true } });
    if (!client || !client.account) throw new Error('Client with account not found');

    console.log(`👤 Using Manager: ${manager.name}`);
    console.log(`👤 Using Client: ${client.fullName} (${client.account.accountNumber})\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Save initial state to restore later
    const initialSession = await prisma.dailySession.findFirst({
      where: { sessionDate: today },
    });
    console.log(`ℹ️ Initial Session Status: ${initialSession?.status || 'NONE'}\n`);

    // --- TEST 1: Transaction with CLOSED session ---
    console.log('🧪 TEST 1: Attempt Transaction with CLOSED session');
    
    // Force close or delete session
    if (initialSession) {
      await prisma.dailySession.update({
        where: { id: initialSession.id },
        data: { status: 'CLOSED' },
      });
    } else {
        // Ensure strictly no open session
        // (If strictly no session exists, it should also count as closed usually, or "not open")
    }

    try {
      await transactionService.createTransaction({
        accountId: client.account.id,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Test transaction 1'
      }, manager.id);
      console.error('❌ FAILED: Transaction should have been blocked!');
      testsPassed = false;
    } catch (e: any) {
      console.log('✅ PASSED: Transaction blocked as expected.');
      console.log(`   Error: ${e.message}`);
    }
    console.log('');

    // --- TEST 2: Transaction with OPEN session ---
    console.log('🧪 TEST 2: Attempt Transaction with OPEN session');

    // Force open session
    await prisma.dailySession.upsert({
      where: { sessionDate: today },
      update: { status: 'OPEN' },
      create: {
        sessionDate: today,
        status: 'OPEN',
        openedBy: manager.id,
      },
    });

    try {
      const tx = await transactionService.createTransaction({
        accountId: client.account.id,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Test transaction 2'
      }, manager.id);
      console.log('✅ PASSED: Transaction created successfully.');
      console.log(`   Tx ID: ${tx.id}`);
    } catch (e: any) {
      console.error('❌ FAILED: Transaction should have succeeded!');
      console.error(e);
      testsPassed = false;
    }
    console.log('');

    // --- Restore Initial State ---
    console.log('Start Restoring Initial State...');
    if (initialSession) {
      await prisma.dailySession.update({
        where: { id: initialSession.id },
        data: { status: initialSession.status },
      });
      console.log(`🔄 Restored session status to: ${initialSession.status}`);
    } else {
      // If there was no session originally, we might want to delete the one we created
      // But keeping it open might be better for manual testing. 
      // Let's leave it as OPEN since user likely wants to test UI.
      console.log('ℹ️ Leaving session OPEN for manual testing.');
    }

  } catch (error) {
    console.error('❌ Script Error:', error);
    testsPassed = false;
  } finally {
    await prisma.$disconnect();
    process.exit(testsPassed ? 0 : 1);
  }
}

main();
