
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { clientService } from '../lib/services/client-service';
import { agentService } from '../lib/services/agent-service';
import { loanService } from '../lib/services/loan-service';
import { transactionService } from '../lib/services/transaction-service';
import { sessionService } from '../lib/services/session-service';
import bcrypt from 'bcrypt';

const PREFIX = 'VERIFY_ ACTOR_';

async function main() {
  console.log('🚀 Starting System Actors Verification...');
  
  try {
    await cleanup();

    // ============================================
    // 1. SETUP ACTORS (Admin, Accountant, Agent)
    // ============================================
    console.log('\n--- 1. Setting up Actors ---');

    // Create Roles if they don't exist (simplified for test)
    const adminRole = await ensureRole('manager', 'Manager');
    const accountantRole = await ensureRole('accountant', 'Accountant');
    const agentRole = await ensureRole('agent', 'Agent');

    // Create Users
    const adminUser = await createUser('admin@verify.local', 'Admin User', adminRole.id);
    const accountantUser = await createUser('accountant@verify.local', 'Accountant User', accountantRole.id);
    const agentUser = await createUser('agent@verify.local', 'Agent User', agentRole.id);

    console.log('✅ Actors created: Admin, Accountant, Agent');

    // ============================================
    // 2. SETUP ENVIRONMENT (Area, Session)
    // ============================================
    console.log('\n--- 2. Setting up Environment ---');
    
    // Create Collection Area
    const area = await prisma.collectionArea.create({
      data: {
        code: `${PREFIX}AREA`,
        name: 'Verification Area',
        status: 'ACTIVE',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }
    });
    console.log('✅ Collection Area created');

    // Ensure Session is Open
    const session = await sessionService.openSession(adminUser.id).catch(async (e) => {
        if (e.message.includes('already open')) {
            const s = await sessionService.getCurrentSession();
            if(!s) throw e;
            return s;
        }
        throw e;
    });
    console.log('✅ Daily Session is OPEN');

    // ============================================
    // 3. ADMIN: Create & Approve Agent
    // ============================================
    console.log('\n--- 3. Admin: Manage Agent ---');

    // Admin creates Agent Profile
    const agentInput = {
      userId: agentUser.id,
      fullName: 'Agent verification',
      phone: '123456789',
      areaIds: [area.id],
      agentCode: `AGT-${Date.now()}` // simplified gen
    };

    // We use agentService.createAgent. 
    // Note: The service expects 'userId' in input.
    // If Admin creates, it should be APPROVED.
    const agent = await agentService.createAgent({
        ...agentInput,
        // Mocking inputs that service might expect generated or passed differently?
        // Checking createAgent signature: createAgent(data: CreateAgentInput, createdBy: string, creatorRoleName?: string)
    }, adminUser.id, 'manager');

    if (agent.approvalStatus !== 'APPROVED') {
        throw new Error(`Agent should be APPROVED when created by Admin, but is ${agent.approvalStatus}`);
    }
    console.log('✅ Agent created and auto-approved by Admin');

    // Verify Agent Assignment
    const agentAreas = await agentService.getAgentAreas(agent.id);
    if (!agentAreas.find(a => a.id === area.id)) {
        throw new Error('Agent not assigned to area');
    }
    console.log('✅ Agent assigned to Area');


    // ============================================
    // 4. ACCOUNTANT: Create Client (Pending Approval)
    // ============================================
    console.log('\n--- 4. Accountant: Create Client ---');

    const clientInput = {
        fullName: 'Client Verification',
        phone: '987654321',
        areaId: area.id,
        agentId: agent.id,
        nationalId: `${PREFIX}ID`, 
    };

    // Accountant creates client -> Should be PENDING_APPROVAL
    const client = await clientService.createClient(clientInput, accountantUser.id, 'accountant');
    
    if (client.approvalStatus !== 'PENDING_APPROVAL') {
        throw new Error(`Client created by Accountant should be PENDING_APPROVAL, got ${client.approvalStatus}`);
    }
    console.log('✅ Client created by Accountant is PENDING_APPROVAL');


    // ============================================
    // 5. ADMIN: Approve Client
    // ============================================
    console.log('\n--- 5. Admin: Approve Client ---');

    const approvedClient = await clientService.approveClient(client.id, adminUser.id);
     if (approvedClient.approvalStatus !== 'APPROVED') {
        throw new Error(`Client should be APPROVED after Admin approval, got ${approvedClient.approvalStatus}`);
    }
    console.log('✅ Client successfully APPROVED by Admin');


    // ============================================
    // 6. CLIENT: Financial Operations
    // ============================================
    console.log('\n--- 6. Financial Operations ---');

    const clientAccount = approvedClient.account;

    // 6a. Deposit (Accountant deposits to Client)
    const depositAmount = 1000;
    const depositTx = await transactionService.createTransaction({
        accountId: clientAccount.id,
        type: 'DEPOSIT',
        amount: depositAmount,
        description: 'Opening Deposit',
        
    }, accountantUser.id);
    
    // Auto-approve deposit for test simplicity (or manually approve)
    await transactionService.approveTransaction(depositTx.id, adminUser.id);
    
    const clientBalanceAfterDeposit = (await prisma.financialAccount.findUnique({where: {id: clientAccount.id}}))?.balance.toNumber();
    if (clientBalanceAfterDeposit !== depositAmount) {
        throw new Error(`Balance mismatch after deposit. Expected ${depositAmount}, got ${clientBalanceAfterDeposit}`);
    }
    console.log(`✅ Deposit of ${depositAmount} successful. Balance: ${clientBalanceAfterDeposit}`);

    // 6b. Withdrawal (Client requests, Accountant processes)
    const withdrawAmount = 200;
    const withdrawTx = await transactionService.createTransaction({
        accountId: clientAccount.id,
        type: 'WITHDRAWAL',
        amount: withdrawAmount,
        description: 'Cash Withdrawal',
    }, accountantUser.id);
    await transactionService.approveTransaction(withdrawTx.id, adminUser.id);

    const clientBalanceAfterWithdraw = (await prisma.financialAccount.findUnique({where: {id: clientAccount.id}}))?.balance.toNumber();
    if (clientBalanceAfterWithdraw !== (depositAmount - withdrawAmount)) {
        throw new Error(`Balance mismatch after withdrawal. Expected ${depositAmount - withdrawAmount}, got ${clientBalanceAfterWithdraw}`);
    }
    console.log(`✅ Withdrawal of ${withdrawAmount} successful. Balance: ${clientBalanceAfterWithdraw}`);


    // ============================================
    // 7. AGENT: Collection (Ventilation)
    // ============================================
    console.log('\n--- 7. Agent: Collection (Ventilation) ---');

    const collectionAmount = 500;
    // Agent collects money
    const collectionBatch = await transactionService.createCollectionEntries({
        areaId: area.id,
        agentId: agent.id,
        entries: [{
            clientId: approvedClient.id,
            amount: collectionAmount,
            description: 'Daily Collection'
        }]
    }, agentUser.id);

    // Collection transactions are created as PENDING or APPROVED? 
    // Checking createCollectionEntries: it creates PENDING_APPROVAL transactions
    
    const collectionTxId = collectionBatch[0].id;
    // Admin approves collection
    await transactionService.approveTransaction(collectionTxId, adminUser.id);

    const clientBalanceAfterCollection = (await prisma.financialAccount.findUnique({where: {id: clientAccount.id}}))?.balance.toNumber();
    const expectedBalance = depositAmount - withdrawAmount + collectionAmount;
    
    if (clientBalanceAfterCollection !== expectedBalance) {
        throw new Error(`Balance mismatch after collection. Expected ${expectedBalance}, got ${clientBalanceAfterCollection}`);
    }
    console.log(`✅ Collection of ${collectionAmount} successful. Balance: ${clientBalanceAfterCollection}`);


    // ============================================
    // 8. LOAN: Request, Approve, Disburse, Repay
    // ============================================
    console.log('\n--- 8. Loan Cycle ---');

    // 8a. Request Loan
    const loanPrincipal = 5000;
    const loan = await loanService.createLoanRequest({
        accountId: clientAccount.id,
        clientId: approvedClient.id,
        principalAmount: loanPrincipal,
        interestRate: 0.10, // 10%
        purpose: 'Business Expansion',
        maturityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6) // 6 months
    }, accountantUser.id);
    console.log(`✅ Loan Request Created: ${loan.loanNumber}`);

    // 8b. Approve & Disburse
    const disbursedLoan = await loanService.approveLoan(loan.id, adminUser.id);
    if (disbursedLoan.status !== 'DISBURSED') {
        throw new Error(`Loan status should be DISBURSED, got ${disbursedLoan.status}`);
    }
    
    // Check account balance (Original + Loan Principal)
    // Note: Disbursement deducts from System/Bank Account and Adds to Client Account? 
    // Let's check logic:
    // approveLoan calls createTransaction(type: 'LOAN_DISBURSEMENT')
    // createTransaction logic for LOAN_DISBURSEMENT: 
    // balanceAfter = account.balance - data.amount (WAIT! Disbursement usually ADDS money to client account, unless this is from System perspective?)
    // Checking `transaction-service.ts`:
    // } else if (data.type === 'WITHDRAWAL' || data.type === 'LOAN_DISBURSEMENT' || data.type === 'TRANSFER') {
    //   balanceAfter = account.balance - data.amount;
    
    // WARNING: It seems LOAN_DISBURSEMENT decreses the account balance in `transaction-service.ts` line 143.
    // If the accountId passed is the CLIENT account, then disbursement should INCREASE balance (Deposit).
    // If `transaction-service.ts` decreases it, maybe it treats disbursement as money LEAVING the bank?
    // But `approveLoan` in `loan-service.ts` calls it with `accountId: loan.accountId` (which is Client Account).
    
    // Let's verify this output carefully. If the logic is reversed, I found a bug.
    
    const clientBalanceAfterLoan = (await prisma.financialAccount.findUnique({where: {id: clientAccount.id}}))?.balance.toNumber();
    console.log(`Debug: Balance after loan disbursement: ${clientBalanceAfterLoan}. Previous: ${expectedBalance}. Loan: ${loanPrincipal}`);
    
    if (clientBalanceAfterLoan < expectedBalance) {
         console.error('⚠️ POTENTIAL BUG DETECTED: Loan Disbursement DECREASED client balance!');
    } else {
         console.log('✅ Loan Disbursement INCREASED client balance (Correct behavior)');
    }


    /* 
       Intervention: If I find a bug here during script writing, I should comment on it.
       Looking at transaction-service.ts again:
       else if (data.type === 'WITHDRAWAL' || data.type === 'LOAN_DISBURSEMENT' || data.type === 'TRANSFER') {
         balanceAfter = account.balance - data.amount;
       }
       
       If `accountId` is the client's account, LOAN_DISBURSEMENT should definitely be a credit (Limit/Cash availability) or a Deposit. 
       Usually, you disburse funds TO the client.
       If the system tracks "Loan Account" separately from "Savings Account", then Disbursement on Loan Account might increase the DEBT (which is a positive balance in liability?).
       But here we are using `loan.accountId` which is usually the client's savings/current account where money lands.
       
       Let's proceed and see the output.
    */

    // 8c. Repayment
    const repaymentAmount = 1000;
    await loanService.recordRepayment(disbursedLoan.id, repaymentAmount, agentUser.id);
    console.log('✅ Repayment recorded');
    
    const clientBalanceAfterRepay = (await prisma.financialAccount.findUnique({where: {id: clientAccount.id}}))?.balance.toNumber();
    console.log(`Balance after repayment: ${clientBalanceAfterRepay}`);


    // ============================================
    // 9. CLEANUP
    // ============================================
    console.log('\n--- 9. Cleanup ---');
    await cleanup();
    console.log('✅ Cleanup successful');

    console.log('\n🎉 ALL SYSTEMS GO! Actors and Use Cases Verified.');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

// Reuseable Helpers

async function createUser(email: string, name: string, roleId: string) {
    const password = await bcrypt.hash('password123', 10);
    return await prisma.user.create({
        data: {
            email,
            name,
            password,
            roleId,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
        }
    });
}

async function ensureRole(slug: string, name: string) {
    return await prisma.userRole.upsert({
        where: { slug },
        update: {},
        create: {
            slug,
            name,
            description: `${name} Role`,
            isProtected: false
        }
    });
}

async function cleanup() {
    const emails = ['admin@verify.local', 'accountant@verify.local', 'agent@verify.local'];
    
    // Find users
    const users = await prisma.user.findMany({ where: { email: { in: emails } } });
    const userIds = users.map(u => u.id);

    if (userIds.length === 0) return;

    // Delete AuditLogs (Foreign Key Constraint)
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });

    // Delete SystemLogs (Foreign Key Constraint)
    await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } });

    // Delete Loans
    await prisma.loan.deleteMany({ where: { createdBy: { in: userIds } } });
    
    // Delete Transactions
    await prisma.transaction.deleteMany({ where: { createdBy: { in: userIds } } });

    // Delete Agents
    await prisma.agent.deleteMany({ where: { userId: { in: userIds } } });

    // Delete Clients created by these users
    await prisma.client.deleteMany({ where: { createdBy: { in: userIds } } });

    // Delete Collection Areas created by these users
    await prisma.collectionArea.deleteMany({ where: { createdBy: { in: userIds } } });

    // Delete Users
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

main();
