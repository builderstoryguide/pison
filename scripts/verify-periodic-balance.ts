
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { reportService } from '../lib/services/report-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Periodic Balance Verification...');

  const prefix = 'REPORT';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const adminUser = await createUser(adminEmail, 'Admin Report', adminRole.id);

    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Report Area', status: 'ACTIVE' }
    });

    const client = await clientService.createClient({
        fullName: 'Client Report',
        areaId: area.id,
        phone: '111222333',
    }, adminUser.id, 'manager');

    await sessionService.openSession(adminUser.id).catch(() => {});
    
    // Ensure starting balance is 0
    await prisma.financialAccount.update({ 
        where: { id: client.accountId }, 
        data: { balance: 0 } 
    });

    console.log('✅ Setup Complete');

    // ============================================
    // 2. GENERATE TRANSACTIONS
    // ============================================
    console.log('\n--- 2. Generate Transactions ---');
    
    // 1. Deposit (1000)
    const deposit = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Test Deposit',
    }, adminUser.id);
    await transactionService.approveTransaction(deposit.id, adminUser.id);
    
    // 2. Collection (500)
    const collection = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'COLLECTION',
        amount: 500,
        description: 'Test Collection',
    }, adminUser.id);
    await transactionService.approveTransaction(collection.id, adminUser.id);

    // 3. Withdrawal (200)
    const withdrawal = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'WITHDRAWAL',
        amount: 200,
        description: 'Test Withdrawal',
    }, adminUser.id);
    await transactionService.approveTransaction(withdrawal.id, adminUser.id);

    // 4. LOAN DISBURSEMENT (Credits Account +10000)
    const loanDisbursement = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'LOAN_DISBURSEMENT',
        amount: 10000,
        description: 'Test Loan Disbursement',
    }, adminUser.id);
    await transactionService.approveTransaction(loanDisbursement.id, adminUser.id);

    // 5. LOAN REPAYMENT (Debits Account -5000)
    const loanRepayment = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'LOAN_REPAYMENT',
        amount: 5000,
        description: 'Test Loan Repayment',
    }, adminUser.id);
    await transactionService.approveTransaction(loanRepayment.id, adminUser.id);


    // EXPECTED:
    // Deposits: 1000
    // Collections: 500
    // Withdrawals: 200
    // Loan Disburse: 10000 (Should be tracked or grouped with deposits/credits?)
    // Loan Repayment: 5000 (Should be tracked or grouped with withdrawals/debits?)
    
    // Net Activity = (1000 + 500 + 10000) - (200 + 5000) = 11500 - 5200 = 6300
    // Closing Balance should be 6300.
    // Opening Balance (Start of month) should be 0.

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    console.log(`Generating report for ${currentMonth}...`);

    const report = await reportService.generateMonthlyBalance({
        month: currentMonth,
        clientId: client.id
    });

    if (report.length === 0) throw new Error('Report is empty');
    const row = report[0];

    console.log('Report Row:', JSON.stringify(row, null, 2));

    // Verify Basic Totals
    if (row.totalDeposits !== 1000) console.warn('⚠️ Total Deposits mismatch (Expected 1000)');
    if (row.totalCollections !== 500) console.warn('⚠️ Total Collections mismatch (Expected 500)');
    if (row.totalWithdrawals !== 200) console.warn('⚠️ Total Withdrawals mismatch (Expected 200)');
    
    // Check new fields
    // @ts-ignore
    if (row.totalLoanDisbursements !== 10000) console.warn(`⚠️ Total Loan Disbursement mismatch ${row.totalLoanDisbursements}`);
    // @ts-ignore
    if (row.totalLoanRepayments !== 5000) console.warn(`⚠️ Total Loan Repayment mismatch ${row.totalLoanRepayments}`);

    // Verify Net Math
    // Report Service Logic: 
    // Opening = Closing - TotalDeposits - TotalCollections + TotalWithdrawals + TotalCommissions
    // If Loans are ignored, Opening calc will be wrong.
    // Closing = 6300 (Real DB balance)
    // If Loans ignored: 6300 - 1000 - 500 + 200 = 5000.
    // Real Opening was 0. So 5000 != 0.
    
    const opening = row.openingBalance;
    console.log(`Calculated Opening Balance: ${opening}`);
    
    if (Math.abs(opening) > 0.01) {
        throw new Error(`Opening Balance calculation is incorrect. Expected ~0, got ${opening}. This likely means some transactions (Loans?) are missing from the calculation.`);
    }

    console.log('✅ Periodic Balance Verification Passed');

    await cleanup(prefix);

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
