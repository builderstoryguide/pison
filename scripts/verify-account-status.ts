
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { reportService } from '../lib/services/report-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Account Status Verification...');

  const prefix = 'STATUS';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const adminUser = await createUser(adminEmail, 'Admin Status', adminRole.id);

    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Status Area', status: 'ACTIVE' }
    });

    const client = await clientService.createClient({
        fullName: 'Client Status',
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
    
    // 1. LOAN DISBURSEMENT (Credits Account +10000)
    // Expect: Credit column = 10000
    const loanDisbursement = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'LOAN_DISBURSEMENT',
        amount: 10000,
        description: 'Test Loan Disbursement',
    }, adminUser.id);
    await transactionService.approveTransaction(loanDisbursement.id, adminUser.id);

    // 2. LOAN REPAYMENT (Debits Account -5000)
    // Expect: Debit column = 5000
    const loanRepayment = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'LOAN_REPAYMENT',
        amount: 5000,
        description: 'Test Loan Repayment',
    }, adminUser.id);
    await transactionService.approveTransaction(loanRepayment.id, adminUser.id);

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-28`; // sufficient for test

    console.log(`Generating statement for ${startDate} to ${endDate}...`);

    const report = await reportService.generateClientStatement({
        clientId: client.id,
        startDate,
        endDate
    });

    console.log('Statement Rows:', JSON.stringify(report.rows, null, 2));

    const disburseRow = report.rows.find(r => r.type === 'LOAN_DISBURSEMENT');
    const repayRow = report.rows.find(r => r.type === 'LOAN_REPAYMENT');

    if (!disburseRow || !repayRow) throw new Error('Missing transaction rows');

    // VERIFY DISBURSEMENT (Should be Credit)
    if (disburseRow.credit !== 10000) {
        throw new Error(`LOAN_DISBURSEMENT should be Credit. Got Credit: ${disburseRow.credit}, Debit: ${disburseRow.debit}`);
    }

    // VERIFY REPAYMENT (Should be Debit)
    if (repayRow.debit !== 5000) {
        throw new Error(`LOAN_REPAYMENT should be Debit. Got Credit: ${repayRow.credit}, Debit: ${repayRow.debit}`);
    }

    console.log('✅ Account Status Verification Passed');

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
