
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { reportService } from '../lib/services/report-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Area Statistics Verification...');

  const prefix = 'AREASTATS';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const adminUser = await createUser(adminEmail, 'Admin Stats', adminRole.id);

    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Stats Area', status: 'ACTIVE' }
    });

    const client = await clientService.createClient({
        fullName: 'Client Stats',
        areaId: area.id,
        phone: '111222333',
    }, adminUser.id, 'manager');

    await sessionService.openSession(adminUser.id).catch(() => {});

    console.log('✅ Setup Complete');


    // ============================================
    // 2. GENERATE TRANSACTIONS
    // ============================================
    console.log('\n--- 2. Generate Transactions ---');
    
    // A. Transaction IN the area (explicit areaId)
    // 1. Deposit (1000)
    await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Area Deposit',
        areaId: area.id
    }, adminUser.id).then(tx => transactionService.approveTransaction(tx.id, adminUser.id));

    // 2. Collection (500)
    await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'COLLECTION',
        amount: 500,
        description: 'Area Collection',
        areaId: area.id
    }, adminUser.id).then(tx => transactionService.approveTransaction(tx.id, adminUser.id));

    // 3. Withdrawal (200)
    await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'WITHDRAWAL',
        amount: 200,
        description: 'Area Withdrawal',
        areaId: area.id
    }, adminUser.id).then(tx => transactionService.approveTransaction(tx.id, adminUser.id));


    // B. Transaction OUTSIDE the area (no areaId)
    // 4. Deposit (300) - Should NOT count
    await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 300,
        description: 'Office Deposit',
        // No areaId
    }, adminUser.id).then(tx => transactionService.approveTransaction(tx.id, adminUser.id));


    console.log('✅ Transactions Generated');


    // ============================================
    // 3. VERIFY STATISTICS
    // ============================================
    console.log('\n--- 3. Verify Statistics ---');
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    // params for generateAreaStatistics requires dates
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-28`;

    const stats = await reportService.generateAreaStatistics({
        startDate,
        endDate,
        areaId: area.id
    });

    if (stats.length !== 1) throw new Error(`Expected 1 area stat row, got ${stats.length}`);
    const row = stats[0];
    
    console.log('Stats Row:', JSON.stringify(row, null, 2));

    // Verify Totals
    if (row.totalDeposits !== 1000) throw new Error(`Total Deposits mismatch. Expected 1000, got ${row.totalDeposits}`);
    if (row.totalCollections !== 500) throw new Error(`Total Collections mismatch. Expected 500, got ${row.totalCollections}`);
    if (row.totalWithdrawals !== 200) throw new Error(`Total Withdrawals mismatch. Expected 200, got ${row.totalWithdrawals}`);
    
    // Verify NOT counted (300 office deposit)
    // If it was counted, deposits would be 1300.
    
    // Verify Net Balance
    // Net = Dep + Col - With = 1000 + 500 - 200 = 1300
    if (row.netBalance !== 1300) throw new Error(`Net Balance mismatch. Expected 1300, got ${row.netBalance}`);
    
    console.log('✅ Statistics Verification Passed');


    // ============================================
    // 4. VERIFY EXPORT
    // ============================================
    console.log('\n--- 4. Verify Export ---');
    const pdfBuffer = await reportService.exportReport(stats, 'pdf', 'area-stats');
    if (!pdfBuffer || pdfBuffer.length === 0) throw new Error('PDF Export failed');
    console.log('✅ Export Verified');


    // ============================================
    // 5. CLEANUP
    // ============================================
    console.log('\n--- 5. Cleanup ---');
    await cleanup(prefix);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Area Statistics Verification Passed!');

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
    await prisma.transaction.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.client.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.collectionArea.deleteMany({ where: { code: { contains: prefix } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

main();
