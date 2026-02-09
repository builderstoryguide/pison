# Financial Transaction Handler Skill

## Purpose
This reference provides detailed guidance for implementing secure, accurate, and auditable financial transactions in the microfinance system.

## When to Use
- Deposits
- Withdrawals
- Transfers
- Loan disbursements
- Loan repayments
- Commission deductions
- Any balance-changing operation

## Core Requirements

### 1. Use Proper Decimal Handling
```javascript
// ALWAYS use decimal.js or similar for monetary calculations
const Decimal = require('decimal.js');

// CORRECT
function calculateCommission(amount, rate) {
  const amountDecimal = new Decimal(amount);
  const rateDecimal = new Decimal(rate);
  return amountDecimal.mul(rateDecimal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// WRONG - Never use floating point arithmetic for money
function calculateCommission(amount, rate) {
  return amount * rate; // This will cause precision errors!
}
```

### 2. Transaction Structure
Every financial transaction must include:
```typescript
interface Transaction {
  id: string;                    // Unique transaction ID (UUID)
  accountId: string;             // Account being modified
  type: TransactionType;         // DEPOSIT, WITHDRAWAL, LOAN_DISBURSEMENT, etc.
  amount: string;                // Decimal amount as string
  balanceBefore: string;         // Account balance before transaction
  balanceAfter: string;          // Account balance after transaction
  status: TransactionStatus;     // PENDING, PENDING_APPROVAL, APPROVED, COMPLETED, FAILED, REVERSED
  createdBy: string;             // User who initiated transaction
  createdAt: Date;               // When transaction was created
  approvedBy?: string;           // User who approved (for four-eye principle)
  approvedAt?: Date;             // When transaction was approved
  reference?: string;            // External reference number
  description: string;           // Human-readable description
  metadata?: Record<string, any>; // Additional data (collection area, agent info, etc.)
}

enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  COMMISSION = 'COMMISSION',
  TRANSFER = 'TRANSFER',
  REVERSAL = 'REVERSAL'
}

enum TransactionStatus {
  PENDING = 'PENDING',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}
```

### 3. Implementation Pattern
```typescript
import { Decimal } from 'decimal.js';

class TransactionService {
  constructor(
    private db: Database,
    private auditLogger: AuditLogger,
    private validator: TransactionValidator
  ) {}

  /**
   * Execute a financial transaction with full ACID compliance
   */
  async executeTransaction(data: TransactionInput): Promise<Transaction> {
    // Step 1: Start database transaction
    const dbTxn = await this.db.beginTransaction();
    
    try {
      // Step 2: Validate input data
      await this.validator.validate(data);
      
      // Step 3: Lock the account for update (prevent concurrent modifications)
      const account = await this.db.query(
        'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
        [data.accountId],
        { transaction: dbTxn }
      );
      
      if (!account) {
        throw new NotFoundError('Account not found');
      }
      
      // Step 4: Validate business rules
      await this.validateBusinessRules(account, data);
      
      // Step 5: Calculate new balance
      const currentBalance = new Decimal(account.balance);
      const amount = new Decimal(data.amount);
      const newBalance = this.calculateNewBalance(currentBalance, amount, data.type);
      
      // Step 6: Create audit log entry (PENDING)
      const auditId = await this.auditLogger.log({
        userId: data.createdBy,
        action: 'TRANSACTION_INITIATED',
        entityType: 'TRANSACTION',
        entityId: null, // Will be updated after transaction creation
        changes: { data },
        status: 'PENDING'
      }, { transaction: dbTxn });
      
      // Step 7: Create transaction record
      const transaction = await this.db.insert('transactions', {
        id: this.generateUUID(),
        accountId: data.accountId,
        type: data.type,
        amount: amount.toString(),
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString(),
        status: this.requiresApproval(data.type) ? 'PENDING_APPROVAL' : 'PENDING',
        createdBy: data.createdBy,
        createdAt: new Date(),
        description: data.description,
        reference: data.reference,
        metadata: data.metadata
      }, { transaction: dbTxn });
      
      // Step 8: Update account balance (only if no approval required)
      if (!this.requiresApproval(data.type)) {
        await this.db.update('accounts', 
          { id: data.accountId },
          { 
            balance: newBalance.toString(),
            updatedAt: new Date()
          },
          { transaction: dbTxn }
        );
      }
      
      // Step 9: Update audit log (COMPLETED)
      await this.auditLogger.updateLog(auditId, {
        entityId: transaction.id,
        status: 'COMPLETED',
        result: { transactionId: transaction.id }
      }, { transaction: dbTxn });
      
      // Step 10: Commit database transaction
      await dbTxn.commit();
      
      // Step 11: Emit event for async processing (notifications, etc.)
      await this.eventBus.emit('transaction.created', transaction);
      
      return transaction;
      
    } catch (error) {
      // Rollback on any error
      await dbTxn.rollback();
      
      // Log the failure
      await this.auditLogger.log({
        userId: data.createdBy,
        action: 'TRANSACTION_FAILED',
        entityType: 'TRANSACTION',
        changes: { data, error: error.message },
        status: 'FAILED'
      });
      
      throw error;
    }
  }
  
  /**
   * Validate business rules before processing transaction
   */
  private async validateBusinessRules(account: Account, data: TransactionInput): Promise<void> {
    // Check account status
    if (account.status !== 'ACTIVE') {
      throw new BusinessRuleError('Account is not active');
    }
    
    // Check daily transaction limits (if applicable)
    const dailyTotal = await this.getDailyTransactionTotal(account.id);
    const dailyLimit = new Decimal(account.dailyLimit || '1000000');
    if (dailyTotal.plus(data.amount).greaterThan(dailyLimit)) {
      throw new BusinessRuleError('Daily transaction limit exceeded');
    }
    
    // Check minimum balance for withdrawals
    if (data.type === TransactionType.WITHDRAWAL) {
      const currentBalance = new Decimal(account.balance);
      const amount = new Decimal(data.amount);
      const newBalance = currentBalance.minus(amount);
      const minimumBalance = new Decimal(account.minimumBalance || '0');
      
      // Only allow negative balance for loan accounts
      if (newBalance.lessThan(minimumBalance) && account.type !== 'LOAN') {
        throw new InsufficientFundsError('Insufficient funds');
      }
    }
    
    // Validate amount is positive
    const amount = new Decimal(data.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new ValidationError('Amount must be positive');
    }
  }
  
  /**
   * Calculate new balance based on transaction type
   */
  private calculateNewBalance(
    currentBalance: Decimal,
    amount: Decimal,
    type: TransactionType
  ): Decimal {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.LOAN_REPAYMENT:
        return currentBalance.plus(amount);
      
      case TransactionType.WITHDRAWAL:
      case TransactionType.LOAN_DISBURSEMENT:
      case TransactionType.COMMISSION:
        return currentBalance.minus(amount);
      
      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }
  }
  
  /**
   * Determine if transaction requires administrator approval
   */
  private requiresApproval(type: TransactionType): boolean {
    // All transactions require approval per four-eye principle
    return true;
  }
  
  /**
   * Approve a pending transaction (Administrator only)
   */
  async approveTransaction(
    transactionId: string,
    approverId: string
  ): Promise<Transaction> {
    const dbTxn = await this.db.beginTransaction();
    
    try {
      // Verify approver is administrator
      const approver = await this.db.findOne('users', { id: approverId });
      if (approver.role !== 'ADMINISTRATOR') {
        throw new UnauthorizedError('Only administrators can approve transactions');
      }
      
      // Get transaction with lock
      const transaction = await this.db.query(
        'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
        [transactionId],
        { transaction: dbTxn }
      );
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      
      if (transaction.status !== 'PENDING_APPROVAL') {
        throw new BusinessRuleError('Transaction is not pending approval');
      }
      
      // Prevent self-approval
      if (transaction.createdBy === approverId) {
        throw new BusinessRuleError('Cannot approve own transaction');
      }
      
      // Get account with lock
      const account = await this.db.query(
        'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
        [transaction.accountId],
        { transaction: dbTxn }
      );
      
      // Update account balance
      await this.db.update('accounts',
        { id: account.id },
        { 
          balance: transaction.balanceAfter,
          updatedAt: new Date()
        },
        { transaction: dbTxn }
      );
      
      // Update transaction status
      const updatedTransaction = await this.db.update('transactions',
        { id: transactionId },
        {
          status: 'COMPLETED',
          approvedBy: approverId,
          approvedAt: new Date()
        },
        { transaction: dbTxn }
      );
      
      // Log approval
      await this.auditLogger.log({
        userId: approverId,
        action: 'TRANSACTION_APPROVED',
        entityType: 'TRANSACTION',
        entityId: transactionId,
        changes: { approvedBy: approverId }
      }, { transaction: dbTxn });
      
      await dbTxn.commit();
      
      // Emit event
      await this.eventBus.emit('transaction.approved', updatedTransaction);
      
      return updatedTransaction;
      
    } catch (error) {
      await dbTxn.rollback();
      throw error;
    }
  }
  
  /**
   * Reject a pending transaction (Administrator only)
   */
  async rejectTransaction(
    transactionId: string,
    approverId: string,
    reason: string
  ): Promise<Transaction> {
    const dbTxn = await this.db.beginTransaction();
    
    try {
      // Verify approver is administrator
      const approver = await this.db.findOne('users', { id: approverId });
      if (approver.role !== 'ADMINISTRATOR') {
        throw new UnauthorizedError('Only administrators can reject transactions');
      }
      
      // Get transaction with lock
      const transaction = await this.db.query(
        'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
        [transactionId],
        { transaction: dbTxn }
      );
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      
      if (transaction.status !== 'PENDING_APPROVAL') {
        throw new BusinessRuleError('Transaction is not pending approval');
      }
      
      // Update transaction status
      const updatedTransaction = await this.db.update('transactions',
        { id: transactionId },
        {
          status: 'REJECTED',
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason: reason
        },
        { transaction: dbTxn }
      );
      
      // Log rejection
      await this.auditLogger.log({
        userId: approverId,
        action: 'TRANSACTION_REJECTED',
        entityType: 'TRANSACTION',
        entityId: transactionId,
        changes: { reason }
      }, { transaction: dbTxn });
      
      await dbTxn.commit();
      
      // Emit event
      await this.eventBus.emit('transaction.rejected', updatedTransaction);
      
      return updatedTransaction;
      
    } catch (error) {
      await dbTxn.rollback();
      throw error;
    }
  }
  
  /**
   * Reverse a completed transaction (Administrator only, for corrections)
   */
  async reverseTransaction(
    transactionId: string,
    reversedBy: string,
    reason: string
  ): Promise<Transaction> {
    const dbTxn = await this.db.beginTransaction();
    
    try {
      // Verify user is administrator
      const user = await this.db.findOne('users', { id: reversedBy });
      if (user.role !== 'ADMINISTRATOR') {
        throw new UnauthorizedError('Only administrators can reverse transactions');
      }
      
      // Get original transaction
      const original = await this.db.query(
        'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
        [transactionId],
        { transaction: dbTxn }
      );
      
      if (!original) {
        throw new NotFoundError('Transaction not found');
      }
      
      if (original.status !== 'COMPLETED') {
        throw new BusinessRuleError('Can only reverse completed transactions');
      }
      
      // Create reversal transaction
      const reversalAmount = new Decimal(original.amount);
      const reversalType = this.getReversalType(original.type);
      
      // Get current account balance
      const account = await this.db.query(
        'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
        [original.accountId],
        { transaction: dbTxn }
      );
      
      const currentBalance = new Decimal(account.balance);
      const newBalance = this.calculateNewBalance(currentBalance, reversalAmount, reversalType);
      
      // Create reversal transaction
      const reversal = await this.db.insert('transactions', {
        id: this.generateUUID(),
        accountId: original.accountId,
        type: 'REVERSAL',
        amount: reversalAmount.toString(),
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString(),
        status: 'COMPLETED',
        createdBy: reversedBy,
        createdAt: new Date(),
        approvedBy: reversedBy,
        approvedAt: new Date(),
        description: `Reversal of transaction ${transactionId}`,
        reference: original.id,
        metadata: { 
          originalTransactionId: original.id,
          reversalReason: reason
        }
      }, { transaction: dbTxn });
      
      // Update account balance
      await this.db.update('accounts',
        { id: account.id },
        { 
          balance: newBalance.toString(),
          updatedAt: new Date()
        },
        { transaction: dbTxn }
      );
      
      // Mark original transaction as reversed
      await this.db.update('transactions',
        { id: original.id },
        { 
          status: 'REVERSED',
          reversedBy: reversedBy,
          reversedAt: new Date(),
          reversalReason: reason
        },
        { transaction: dbTxn }
      );
      
      // Log reversal
      await this.auditLogger.log({
        userId: reversedBy,
        action: 'TRANSACTION_REVERSED',
        entityType: 'TRANSACTION',
        entityId: transactionId,
        changes: { reason, reversalId: reversal.id }
      }, { transaction: dbTxn });
      
      await dbTxn.commit();
      
      return reversal;
      
    } catch (error) {
      await dbTxn.rollback();
      throw error;
    }
  }
  
  private getReversalType(originalType: TransactionType): TransactionType {
    switch (originalType) {
      case TransactionType.DEPOSIT:
        return TransactionType.WITHDRAWAL;
      case TransactionType.WITHDRAWAL:
        return TransactionType.DEPOSIT;
      case TransactionType.LOAN_DISBURSEMENT:
        return TransactionType.LOAN_REPAYMENT;
      case TransactionType.LOAN_REPAYMENT:
        return TransactionType.LOAN_DISBURSEMENT;
      default:
        throw new Error(`Cannot reverse transaction type: ${originalType}`);
    }
  }
  
  private generateUUID(): string {
    // Use a proper UUID library like 'uuid'
    return require('uuid').v4();
  }
}
```

## Error Handling
Define custom error classes:
```typescript
class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

class InsufficientFundsError extends TransactionError {
  constructor(message: string = 'Insufficient funds') {
    super(message, 'INSUFFICIENT_FUNDS', 422);
  }
}

class BusinessRuleError extends TransactionError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
  }
}

class UnauthorizedError extends TransactionError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

class NotFoundError extends TransactionError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

class ValidationError extends TransactionError {
  constructor(message: string, public details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}
```

## Testing Guidelines
```typescript
describe('TransactionService', () => {
  let service: TransactionService;
  let mockDb: MockDatabase;
  let mockAuditLogger: MockAuditLogger;
  
  beforeEach(() => {
    mockDb = new MockDatabase();
    mockAuditLogger = new MockAuditLogger();
    service = new TransactionService(mockDb, mockAuditLogger);
  });
  
  describe('executeTransaction', () => {
    it('should successfully process a deposit', async () => {
      // Arrange
      const account = {
        id: 'acc-1',
        balance: '1000.00',
        status: 'ACTIVE'
      };
      mockDb.mockQuery(account);
      
      const input = {
        accountId: 'acc-1',
        type: TransactionType.DEPOSIT,
        amount: '500.00',
        createdBy: 'user-1',
        description: 'Test deposit'
      };
      
      // Act
      const result = await service.executeTransaction(input);
      
      // Assert
      expect(result.balanceAfter).toBe('1500.00');
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockDb.commit).toHaveBeenCalled();
      expect(mockDb.rollback).not.toHaveBeenCalled();
    });
    
    it('should rollback on insufficient funds', async () => {
      // Arrange
      const account = {
        id: 'acc-1',
        balance: '100.00',
        status: 'ACTIVE',
        type: 'SAVINGS'
      };
      mockDb.mockQuery(account);
      
      const input = {
        accountId: 'acc-1',
        type: TransactionType.WITHDRAWAL,
        amount: '500.00',
        createdBy: 'user-1',
        description: 'Test withdrawal'
      };
      
      // Act & Assert
      await expect(service.executeTransaction(input))
        .rejects
        .toThrow(InsufficientFundsError);
      
      expect(mockDb.rollback).toHaveBeenCalled();
      expect(mockDb.commit).not.toHaveBeenCalled();
    });
    
    it('should handle concurrent transactions correctly', async () => {
      // Test optimistic locking and race conditions
      // Implementation depends on your database and locking strategy
    });
  });
  
  describe('approveTransaction', () => {
    it('should approve pending transaction and update balance', async () => {
      // Test implementation
    });
    
    it('should reject approval by non-administrator', async () => {
      // Test implementation
    });
    
    it('should reject self-approval', async () => {
      // Test implementation
    });
  });
});
```

## API Endpoint Example
```typescript
// POST /api/transactions
router.post('/transactions', 
  authenticate,
  authorize(['AGENT', 'ACCOUNTANT', 'ADMINISTRATOR']),
  validateRequest(transactionSchema),
  async (req, res, next) => {
    try {
      const transaction = await transactionService.executeTransaction({
        ...req.body,
        createdBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/transactions/:id/approve
router.post('/transactions/:id/approve',
  authenticate,
  authorize(['ADMINISTRATOR']),
  async (req, res, next) => {
    try {
      const transaction = await transactionService.approveTransaction(
        req.params.id,
        req.user.id
      );
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);
```

## Key Takeaways
1. Always use DB transactions for financial operations.
2. Use decimal arithmetic; never float.
3. Lock accounts during updates.
4. Validate everything, including business rules and limits.
5. Audit all actions, successes, and failures.
6. Enforce the four-eye principle.
7. Roll back on errors.
8. Test thoroughly.
9. Implement idempotency.
10. Monitor and alert on failures.
