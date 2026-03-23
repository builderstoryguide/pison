
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { commissionService } from '../lib/services/commission-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Commission Verification...');

  const prefix = 'COMMISSION';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const adminUser = await createUser(adminEmail, 'Admin Commission', adminRole.id);

    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Commission Area', status: 'ACTIVE' }
    });

    const client = await clientService.createClient({
        fullName: 'Client Commission',
        areaId: area.id,
        phone: '111222333',
    }, adminUser.id, 'manager');

    await sessionService.openSession(adminUser.id).catch(() => {});
    
    // Ensure starting balance is 0 for clarity
    await prisma.financialAccount.update({ 
        where: { id: client.accountId }, 
        data: { balance: 10000, availableBalance: 10000 } 
    });

    console.log('✅ Setup Complete (Client Balance: 10000)');


    // ============================================
    // 2. GENERATE WITHDRAWALS
    // ============================================
    console.log('\n--- 2. Generate Withdrawals ---');
    
    // Rate is hardcoded to 2% in Service.
    // 1. Withdrawal 1000 -> Commission 20
    const w1 = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'WITHDRAWAL',
        amount: 1000,
        description: 'Withdrawal 1',
    }, adminUser.id);
    await transactionService.approveTransaction(w1.id, adminUser.id);
    
    // 2. Withdrawal 500 -> Commission 10
    const w2 = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'WITHDRAWAL',
        amount: 500,
        description: 'Withdrawal 2',
    }, adminUser.id);
    await transactionService.approveTransaction(w2.id, adminUser.id);
    
    // 3. Deposit 2000 (Should NOT trigger commission)
    const d1 = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 2000,
        description: 'Deposit 1',
    }, adminUser.id);
    await transactionService.approveTransaction(d1.id, adminUser.id);

    // Balance Check before commission
    // Start: 10000 - 1000 - 500 + 2000 = 10500
    const accountBefore = await prisma.financialAccount.findUnique({ where: { id: client.accountId } });
    if (accountBefore?.balance.toNumber() !== 10500) {
        throw new Error(`Balance mismatch before commission. Expected 10500, got ${accountBefore?.balance}`);
    }
    console.log('✅ Withdrawals Generated (Current Balance: 10500)');


    // ============================================
    // 3. RUN COMMISSION CALCULATION
    // ============================================
    console.log('\n--- 3. Run Commission Calculation ---');
    
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    console.log(`Calculating for period: ${currentPeriod}`);
    
    const commissions = await commissionService.createCommissionsForPeriod(currentPeriod, adminUser.id);
    
    console.log(`Created ${commissions.length} commission records.`);
    
    if (commissions.length !== 2) {
         throw new Error(`Expected 2 commissions (for 2 withdrawals), got ${commissions.length}`);
    }

    // Verify Amounts
    const totalCommission = commissions.reduce((sum, c) => sum + c.amount.toNumber(), 0);
    if (totalCommission !== 30) {
        throw new Error(`Expected total commission 30 (20+10), got ${totalCommission}`);
    }
    console.log('✅ Commissions Calculated Correctly');


    // ============================================
    // 4. VERIFY ACCOUNT DEDUCTION
    // ============================================
    console.log('\n--- 4. Verify Account Deduction ---');
    
    const accountAfter = await prisma.financialAccount.findUnique({ where: { id: client.accountId } });
    const finalBalance = accountAfter?.balance.toNumber();
    
    // Expected: 10500 - 30 = 10470
    if (finalBalance !== 10470) {
        throw new Error(`Balance mismatch after commission. Expected 10470, got ${finalBalance}`);
    }
    
    // Verify LEDGER entries exist
    const commissionTxns = await prisma.transaction.findMany({
        where: { accountId: client.accountId, type: 'COMMISSION' }
    });
    
    if (commissionTxns.length !== 2) {
        throw new Error(`Expected 2 COMMISSION transactions in ledger, got ${commissionTxns.length}`);
    }
    console.log('✅ Account Deduction Verified');


    // ============================================
    // 5. VERIFY REPORTING
    // ============================================
    console.log('\n--- 5. Verify Reporting ---');
    
    const reportData = await commissionService.getCommissions(currentPeriod);
    const clientReport = reportData.filter(c => c.clientId === client.id);
    
    if (clientReport.length !== 2) {
        throw new Error('Report data missing commission records');
    }
    console.log('✅ Commission Reporting Verified');


    // ============================================
    // 6. CLEANUP
    // ============================================
    console.log('\n--- 6. Cleanup ---');
    await cleanup(prefix);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Commission Verification Passed!');

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
    
    // Delete commissions first
    // Need to find commissions by users? No, commissions are linked to transactions.
    // Easier to delete all commissions associated with our test transactions if we can track them.
    // But since we are deleting transactions by creator, that cascades? No, Prisma Relation is SetNull or Restrict usually.
    // Let's explicitly delete commissions for the client.
    const clients = await prisma.client.findMany({ where: { createdBy: { in: userIds } } });
    const clientIds = clients.map(c => c.id);
    if (clientIds.length > 0) {
        await prisma.commission.deleteMany({ where: { clientId: { in: clientIds } } });
    }

    await prisma.transaction.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.client.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.collectionArea.deleteMany({ where: { code: { contains: prefix } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

main();
