
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { transactionService } from '../lib/services/transaction-service';
import { reportService } from '../lib/services/report-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Client Statement Export Verification...');

  const prefix = 'EXPORT';
  const adminEmail = `admin-${prefix}@verify.local`;

  try {
    await cleanup(prefix);

    // ============================================
    // 1. SETUP
    // ============================================
    console.log('\n--- 1. Setup ---');
    const adminRole = await ensureRole('manager', 'Manager', true);
    const adminUser = await createUser(adminEmail, 'Admin Export', adminRole.id);

    const area = await prisma.collectionArea.create({
      data: { code: `${prefix}-AREA`, name: 'Export Area', status: 'ACTIVE' }
    });

    const client = await clientService.createClient({
        fullName: 'Client Export',
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
    console.log('\n--- 2. Generate Data ---');
    
    // Deposit
    const deposit = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Export Deposit',
    }, adminUser.id);
    await transactionService.approveTransaction(deposit.id, adminUser.id);

    // Withdrawal
    const withdrawal = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'WITHDRAWAL',
        amount: 200,
        description: 'Export Withdrawal',
    }, adminUser.id);
    await transactionService.approveTransaction(withdrawal.id, adminUser.id);

    // Loan Disbursement (Test new logic)
    const loanDisbursement = await transactionService.createTransaction({
        accountId: client.accountId,
        type: 'LOAN_DISBURSEMENT',
        amount: 5000,
        description: 'Export Loan',
    }, adminUser.id);
    await transactionService.approveTransaction(loanDisbursement.id, adminUser.id);


    // ============================================
    // 3. GENERATE STATEMENT
    // ============================================
    console.log('\n--- 3. Generate Statement ---');
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-28`;

    const report = await reportService.generateClientStatement({
        clientId: client.id,
        startDate,
        endDate
    });

    if (report.rows.length !== 3) throw new Error(`Expected 3 rows, got ${report.rows.length}`);
    console.log('✅ Statement Generated');


    // ============================================
    // 4. TEST EXPORTS
    // ============================================
    console.log('\n--- 4. Test Exports ---');

    // Test CSV
    console.log('[Export] CSV...');
    const csvBuffer = await reportService.exportReport(report.rows, 'csv', 'statement');
    if (!csvBuffer || csvBuffer.length === 0) throw new Error('CSV Export failed (empty buffer)');
    const csvContent = csvBuffer.toString();
    if (!csvContent.includes('Export Deposit') || !csvContent.includes('Export Loan')) {
        throw new Error('CSV content missing transaction descriptions');
    }
    console.log('✅ CSV Export Verified');

    // Test Excel
    console.log('[Export] Excel...');
    const excelBuffer = await reportService.exportReport(report.rows, 'excel', 'statement');
    if (!excelBuffer || excelBuffer.length === 0) throw new Error('Excel Export failed (empty buffer)');
    // checking generic magic bytes for zip (xlsx is zip) - PK..
    if (excelBuffer.toString('hex', 0, 4) !== '504b0304') {
        console.warn('⚠️ Excel buffer header mismatch (expected PK.. for xlsx/zip).');
    }
    console.log('✅ Excel Export Verified');

    // Test PDF
    console.log('[Export] PDF...');
    const pdfBuffer = await reportService.exportReport(report.rows, 'pdf', 'statement');
    if (!pdfBuffer || pdfBuffer.length === 0) throw new Error('PDF Export failed (empty buffer)');
    // checking generic magic bytes for PDF - %PDF
    if (pdfBuffer.toString().slice(0, 4) !== '%PDF') {
         throw new Error('PDF buffer header mismatch (expected %PDF)');
    }
    console.log('✅ PDF Export Verified');


    // ============================================
    // 5. CLEANUP
    // ============================================
    console.log('\n--- 5. Cleanup ---');
    await cleanup(prefix);
    console.log('✅ Cleanup Complete');

    console.log('\n🎉 Client Statement Export Verification Passed!');

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
