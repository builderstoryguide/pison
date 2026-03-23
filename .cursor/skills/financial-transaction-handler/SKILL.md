---
name: financial-transaction-handler
description: Implement secure, ACID-compliant financial transactions with proper validation, audit logging, and error handling. Use when implementing deposits, withdrawals, transfers, loan disbursements/repayments, commissions, reversals, or any operation that modifies account balances.
---

# Financial Transaction Handler

## Quick start
Use this skill whenever you touch balances or create financial transactions. Prioritize ACID safety, decimal math, auditability, and the four-eye principle.

## Core workflow (always follow)
1. Start a DB transaction and lock the target account row (`SELECT ... FOR UPDATE`).
2. Validate input and business rules (amount > 0, account status, limits).
3. Calculate balances using `decimal.js` (never floats).
4. Create an audit log entry with `PENDING` status.
5. Create the transaction record with full before/after balances.
6. If approval required, set `PENDING_APPROVAL` and do not update balance yet.
7. If no approval required, update balance atomically inside the DB transaction.
8. Update audit log to `COMPLETED`, then commit.
9. On any error: rollback and log failure.

## Required data fields
Ensure every transaction includes:
- `id`, `accountId`, `type`, `amount`, `balanceBefore`, `balanceAfter`
- `status`, `createdBy`, `createdAt`
- `approvedBy`, `approvedAt` (when applicable)
- `description`, `reference`, `metadata`

## Approval rules
- All balance-changing operations require approval unless explicitly exempted.
- Prevent self-approval.
- Approval updates the account balance in the same DB transaction.

## Error handling
Use domain-specific errors with explicit codes and HTTP status. Never leak sensitive data in messages. Roll back on any failure.

## Testing expectations
Cover:
- Happy paths for each transaction type
- Insufficient funds / limit violations
- Approval and rejection flows
- Concurrency/locking behavior
- Reversal correctness

## Additional resources
- Full implementation pattern and examples: [reference.md](reference.md)
