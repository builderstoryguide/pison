# Database Design Skill

## Purpose
This reference provides comprehensive guidance for designing a secure, performant, and maintainable database schema for the microfinance system.

## When to Use
- Designing database tables and relationships
- Creating database migrations
- Adding indexes for performance
- Implementing constraints
- Writing complex queries
- Optimizing database performance

## Database Choice

**Recommended: PostgreSQL**
- ACID compliance
- Strong data integrity features
- JSON support for metadata
- Excellent performance
- Robust transaction support
- Free and open source

Alternative: MySQL, SQL Server, or Oracle (for enterprise)

## Complete Database Schema

### 1. Users Table

```sql
CREATE TYPE user_role AS ENUM ('ADMINISTRATOR', 'ACCOUNTANT', 'AGENT', 'CLIENT');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  status user_status NOT NULL DEFAULT 'ACTIVE',
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Collection Areas Table

```sql
CREATE TYPE area_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE collection_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  status area_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_areas_code ON collection_areas(code);
CREATE INDEX idx_areas_status ON collection_areas(status);
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON collection_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Agents Table

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  agent_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  status user_status NOT NULL DEFAULT 'ACTIVE',
  hire_date DATE,
  commission_rate DECIMAL(5,4) CHECK (commission_rate >= 0 AND commission_rate <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_code ON agents(agent_code);
CREATE INDEX idx_agents_status ON agents(status);
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Agent Area Assignments Table

```sql
CREATE TABLE agent_area_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES collection_areas(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE(agent_id, area_id)
);

CREATE INDEX idx_agent_areas_agent ON agent_area_assignments(agent_id);
CREATE INDEX idx_agent_areas_area ON agent_area_assignments(area_id);
```

### 5. Clients Table

```sql
CREATE TYPE client_type AS ENUM ('INDIVIDUAL', 'BUSINESS');
CREATE TYPE client_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED');

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  client_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  client_type client_type NOT NULL DEFAULT 'INDIVIDUAL',
  national_id VARCHAR(50),
  tax_id VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  area_id UUID REFERENCES collection_areas(id),
  status client_status NOT NULL DEFAULT 'ACTIVE',
  kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_verified_by UUID REFERENCES users(id),
  credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT chk_phone_format CHECK (phone ~* '^\+?[0-9]{8,}$')
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_area ON clients(area_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_name ON clients(full_name);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Accounts Table

```sql
CREATE TYPE account_type AS ENUM ('SAVINGS', 'CURRENT', 'LOAN');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(20) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  account_type account_type NOT NULL DEFAULT 'SAVINGS',
  currency VARCHAR(3) NOT NULL DEFAULT 'XAF', -- Central African Franc
  balance DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  available_balance DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  minimum_balance DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  daily_withdrawal_limit DECIMAL(19,4),
  monthly_withdrawal_limit DECIMAL(19,4),
  status account_status NOT NULL DEFAULT 'ACTIVE',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id),
  closure_reason TEXT,
  interest_rate DECIMAL(5,4) CHECK (interest_rate >= 0),
  commission_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT chk_balance_precision CHECK (balance = ROUND(balance, 4)),
  CONSTRAINT chk_available_balance CHECK (available_balance <= balance),
  CONSTRAINT chk_account_number_format CHECK (account_number ~* '^[A-Z0-9]+$')
);

CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_client ON accounts(client_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Transactions Table

```sql
CREATE TYPE transaction_type AS ENUM (
  'DEPOSIT', 
  'WITHDRAWAL', 
  'LOAN_DISBURSEMENT', 
  'LOAN_REPAYMENT',
  'COMMISSION',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'INTEREST',
  'FEE',
  'REVERSAL',
  'ADJUSTMENT'
);

CREATE TYPE transaction_status AS ENUM (
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'COMPLETED',
  'FAILED',
  'REJECTED',
  'REVERSED',
  'CANCELLED'
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  related_account_id UUID REFERENCES accounts(id), -- For transfers
  type transaction_type NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'XAF',
  balance_before DECIMAL(19,4) NOT NULL,
  balance_after DECIMAL(19,4) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  description TEXT NOT NULL,
  reference VARCHAR(100),
  external_reference VARCHAR(100),
  channel VARCHAR(50), -- OFFICE, MOBILE, AGENT, ATM, etc.
  location VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  reversed_at TIMESTAMP WITH TIME ZONE,
  reversed_by UUID REFERENCES users(id),
  reversal_reason TEXT,
  reversal_transaction_id UUID REFERENCES transactions(id),
  original_transaction_id UUID REFERENCES transactions(id), -- For reversals
  
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_amount_precision CHECK (amount = ROUND(amount, 4)),
  CONSTRAINT chk_balance_precision CHECK (
    balance_before = ROUND(balance_before, 4) AND
    balance_after = ROUND(balance_after, 4)
  ),
  CONSTRAINT chk_balance_calculation CHECK (
    CASE type
      WHEN 'DEPOSIT' THEN balance_after = balance_before + amount
      WHEN 'WITHDRAWAL' THEN balance_after = balance_before - amount
      WHEN 'LOAN_DISBURSEMENT' THEN balance_after = balance_before - amount
      WHEN 'LOAN_REPAYMENT' THEN balance_after = balance_before + amount
      WHEN 'COMMISSION' THEN balance_after = balance_before - amount
      ELSE TRUE
    END
  )
);

CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_approved_by ON transactions(approved_by);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN (metadata);
```

### 8. Loans Table

```sql
CREATE TYPE loan_status AS ENUM (
  'PENDING',
  'APPROVED',
  'DISBURSED',
  'ACTIVE',
  'PAID_OFF',
  'DEFAULTED',
  'WRITTEN_OFF',
  'REJECTED'
);

CREATE TYPE repayment_frequency AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY');

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number VARCHAR(50) NOT NULL UNIQUE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  principal_amount DECIMAL(19,4) NOT NULL,
  interest_rate DECIMAL(5,4) NOT NULL,
  duration_months INTEGER NOT NULL,
  repayment_frequency repayment_frequency NOT NULL DEFAULT 'MONTHLY',
  installment_amount DECIMAL(19,4) NOT NULL,
  total_amount DECIMAL(19,4) NOT NULL, -- Principal + Interest
  amount_disbursed DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  amount_repaid DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  outstanding_balance DECIMAL(19,4) NOT NULL,
  status loan_status NOT NULL DEFAULT 'PENDING',
  purpose TEXT,
  collateral_description TEXT,
  guarantor_name VARCHAR(255),
  guarantor_phone VARCHAR(20),
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  applied_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  disbursed_at TIMESTAMP WITH TIME ZONE,
  disbursed_by UUID REFERENCES users(id),
  first_repayment_date DATE,
  maturity_date DATE,
  paid_off_at TIMESTAMP WITH TIME ZONE,
  defaulted_at TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
  CONSTRAINT chk_interest_rate CHECK (interest_rate >= 0 AND interest_rate <= 1),
  CONSTRAINT chk_duration CHECK (duration_months > 0),
  CONSTRAINT chk_installment CHECK (installment_amount > 0),
  CONSTRAINT chk_outstanding CHECK (outstanding_balance >= 0),
  CONSTRAINT chk_amounts_precision CHECK (
    principal_amount = ROUND(principal_amount, 4) AND
    amount_disbursed = ROUND(amount_disbursed, 4) AND
    amount_repaid = ROUND(amount_repaid, 4) AND
    outstanding_balance = ROUND(outstanding_balance, 4)
  )
);

CREATE INDEX idx_loans_number ON loans(loan_number);
CREATE INDEX idx_loans_account ON loans(account_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_maturity ON loans(maturity_date);
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9. Commissions Table

```sql
CREATE TYPE commission_type AS ENUM ('WITHDRAWAL', 'TRANSFER', 'LOAN_PROCESSING', 'OTHER');

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  commission_type commission_type NOT NULL,
  base_amount DECIMAL(19,4) NOT NULL, -- Transaction amount
  commission_rate DECIMAL(5,4), -- If percentage-based
  commission_amount DECIMAL(19,4) NOT NULL,
  calculation_method VARCHAR(50), -- PERCENTAGE, FLAT, TIERED
  waived BOOLEAN NOT NULL DEFAULT FALSE,
  waived_by UUID REFERENCES users(id),
  waived_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_commission_amounts CHECK (
    base_amount >= 0 AND
    commission_amount >= 0 AND
    base_amount = ROUND(base_amount, 4) AND
    commission_amount = ROUND(commission_amount, 4)
  )
);

CREATE INDEX idx_commissions_transaction ON commissions(transaction_id);
CREATE INDEX idx_commissions_account ON commissions(account_id);
CREATE INDEX idx_commissions_created_at ON commissions(created_at);
```

### 10. Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_family UUID NOT NULL, -- For refresh token rotation
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token_family ON sessions(token_family);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Clean up expired sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### 11. Audit Logs Table

```sql
CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE',
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
  'TRANSACTION_CREATED', 'TRANSACTION_APPROVED', 'TRANSACTION_REJECTED',
  'TRANSACTION_REVERSED', 'UNAUTHORIZED_ACCESS_ATTEMPT',
  'ACCOUNT_LOCKED', 'PASSWORD_CHANGED',
  'DAY_CLOSED', 'SYSTEM_CONFIG_CHANGED'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20), -- SUCCESS, FAILED, PENDING
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_changes ON audit_logs USING GIN (changes);
```

### 12. Daily Closures Table

```sql
CREATE TABLE daily_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_date DATE NOT NULL UNIQUE,
  total_deposits DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  total_withdrawals DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  total_loans_disbursed DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  total_loan_repayments DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  total_commissions DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  net_cash_flow DECIMAL(19,4) NOT NULL,
  expected_cash DECIMAL(19,4) NOT NULL,
  actual_cash DECIMAL(19,4) NOT NULL,
  surplus_shortage DECIMAL(19,4) NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  pending_approvals INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  closed_by UUID NOT NULL REFERENCES users(id),
  closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_closures_date ON daily_closures(closure_date DESC);
```

### 13. System Configuration Table

```sql
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_config_key ON system_config(key);

-- Insert default configurations
INSERT INTO system_config (key, value, description) VALUES
  ('commission.withdrawal.rate', '0.01', 'Commission rate for withdrawals (1%)'),
  ('commission.withdrawal.minimum', '100', 'Minimum commission for withdrawals'),
  ('commission.withdrawal.maximum', '5000', 'Maximum commission for withdrawals'),
  ('limits.daily_withdrawal', '100000', 'Default daily withdrawal limit'),
  ('limits.transaction_maximum', '1000000', 'Maximum transaction amount'),
  ('security.max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
  ('security.lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
  ('security.password_expiry_days', '90', 'Password expiration period in days'),
  ('business.minimum_account_balance', '1000', 'Minimum account balance'),
  ('business.interest_calculation_method', '"DAILY"', 'Interest calculation method');
```

## Database Migration Example

Using a migration tool like `node-pg-migrate` or `typeorm`:

```typescript
// migrations/001_initial_schema.ts

export async function up(db: Database): Promise<void> {
  // Create ENUM types
  await db.query(`
    CREATE TYPE user_role AS ENUM ('ADMINISTRATOR', 'ACCOUNTANT', 'AGENT', 'CLIENT');
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED');
    -- ... other ENUMs
  `);
  
  // Create tables in dependency order
  await db.query(`
    CREATE TABLE users (
      -- ... table definition
    );
  `);
  
  // Create indexes
  await db.query(`
    CREATE INDEX idx_users_username ON users(username);
    -- ... other indexes
  `);
  
  // Create triggers
  await db.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(db: Database): Promise<void> {
  // Drop in reverse order
  await db.query(`
    DROP TABLE IF EXISTS daily_closures CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS sessions CASCADE;
    DROP TABLE IF EXISTS commissions CASCADE;
    DROP TABLE IF EXISTS loans CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS accounts CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
    DROP TABLE IF EXISTS agent_area_assignments CASCADE;
    DROP TABLE IF EXISTS agents CASCADE;
    DROP TABLE IF EXISTS collection_areas CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS user_status CASCADE;
    -- ... drop other types
  `);
}
```

## Query Optimization Examples

### 1. Get Client Account with Balance

```sql
-- Efficient query with proper indexing
SELECT 
  c.id,
  c.full_name,
  c.client_code,
  a.account_number,
  a.balance,
  a.available_balance,
  a.status as account_status,
  ca.name as area_name
FROM clients c
INNER JOIN accounts a ON a.client_id = c.id
LEFT JOIN collection_areas ca ON ca.id = c.area_id
WHERE c.id = $1 AND c.status = 'ACTIVE';
```

### 2. Get Pending Transactions for Approval

```sql
-- With pagination
SELECT 
  t.id,
  t.transaction_number,
  t.type,
  t.amount,
  t.created_at,
  t.description,
  a.account_number,
  c.full_name as client_name,
  u.username as created_by_username
FROM transactions t
INNER JOIN accounts a ON a.id = t.account_id
INNER JOIN clients c ON c.id = a.client_id
INNER JOIN users u ON u.id = t.created_by
WHERE t.status = 'PENDING_APPROVAL'
ORDER BY t.created_at DESC
LIMIT $1 OFFSET $2;
```

### 3. Daily Collection Report

```sql
-- Daily collections by agent and area
SELECT 
  ca.name as area_name,
  ag.agent_code,
  ag.full_name as agent_name,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.type = 'DEPOSIT' THEN t.amount ELSE 0 END) as total_deposits,
  SUM(CASE WHEN t.type = 'WITHDRAWAL' THEN t.amount ELSE 0 END) as total_withdrawals,
  SUM(CASE WHEN t.type = 'DEPOSIT' THEN t.amount ELSE -t.amount END) as net_amount
FROM transactions t
INNER JOIN accounts a ON a.id = t.account_id
INNER JOIN clients c ON c.id = a.client_id
INNER JOIN collection_areas ca ON ca.id = c.area_id
INNER JOIN users u ON u.id = t.created_by
INNER JOIN agents ag ON ag.user_id = u.id
WHERE DATE(t.created_at) = $1
  AND t.status = 'COMPLETED'
GROUP BY ca.name, ag.agent_code, ag.full_name
ORDER BY ca.name, ag.agent_code;
```

## Stored Procedures for Complex Operations

### Calculate Commission

```sql
CREATE OR REPLACE FUNCTION calculate_commission(
  p_transaction_id UUID,
  p_amount DECIMAL(19,4)
)
RETURNS DECIMAL(19,4) AS $$
DECLARE
  v_commission DECIMAL(19,4);
  v_rate DECIMAL(5,4);
  v_minimum DECIMAL(19,4);
  v_maximum DECIMAL(19,4);
BEGIN
  -- Get configuration
  SELECT 
    (value->>'commission.withdrawal.rate')::DECIMAL(5,4),
    (value->>'commission.withdrawal.minimum')::DECIMAL(19,4),
    (value->>'commission.withdrawal.maximum')::DECIMAL(19,4)
  INTO v_rate, v_minimum, v_maximum
  FROM system_config
  WHERE key IN ('commission.withdrawal.rate', 'commission.withdrawal.minimum', 'commission.withdrawal.maximum');
  
  -- Calculate commission
  v_commission := p_amount * v_rate;
  
  -- Apply minimum/maximum
  v_commission := GREATEST(v_commission, v_minimum);
  v_commission := LEAST(v_commission, v_maximum);
  
  RETURN ROUND(v_commission, 4);
END;
$$ LANGUAGE plpgsql;
```

## Database Backup Strategy

```bash
# Daily backups
pg_dump -h localhost -U postgres -d microfinance > backup_$(date +%Y%m%d).sql

# Point-in-time recovery setup
# Enable WAL archiving in postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /path/to/archive/%f'
```

## Performance Monitoring

```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan as avg_seq_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;
```

## Data Integrity Checks

```sql
-- Check for orphaned records
SELECT 'Orphaned Transactions' as check_name, COUNT(*) as count
FROM transactions t
LEFT JOIN accounts a ON a.id = t.account_id
WHERE a.id IS NULL

UNION ALL

SELECT 'Orphaned Accounts', COUNT(*)
FROM accounts a
LEFT JOIN clients c ON c.id = a.client_id
WHERE c.id IS NULL;

-- Check balance integrity
SELECT 
  a.account_number,
  a.balance as recorded_balance,
  COALESCE(SUM(
    CASE t.type
      WHEN 'DEPOSIT' THEN t.amount
      WHEN 'WITHDRAWAL' THEN -t.amount
      WHEN 'LOAN_REPAYMENT' THEN t.amount
      WHEN 'LOAN_DISBURSEMENT' THEN -t.amount
      ELSE 0
    END
  ), 0) as calculated_balance,
  a.balance - COALESCE(SUM(
    CASE t.type
      WHEN 'DEPOSIT' THEN t.amount
      WHEN 'WITHDRAWAL' THEN -t.amount
      WHEN 'LOAN_REPAYMENT' THEN t.amount
      WHEN 'LOAN_DISBURSEMENT' THEN -t.amount
      ELSE 0
    END
  ), 0) as difference
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.status = 'COMPLETED'
GROUP BY a.id, a.account_number, a.balance
HAVING ABS(a.balance - COALESCE(SUM(
  CASE t.type
    WHEN 'DEPOSIT' THEN t.amount
    WHEN 'WITHDRAWAL' THEN -t.amount
    WHEN 'LOAN_REPAYMENT' THEN t.amount
    WHEN 'LOAN_DISBURSEMENT' THEN -t.amount
    ELSE 0
  END
), 0)) > 0.01; -- Allow for minor rounding differences
```

## Key Principles

1. Use appropriate data types: DECIMAL for money, UUID for IDs, TIMESTAMP WITH TIME ZONE for dates
2. Implement constraints: Ensure data integrity at database level
3. Add indexes strategically: On foreign keys, frequently queried columns, and WHERE/JOIN conditions
4. Use transactions: For operations that modify multiple tables
5. Implement soft deletes: Never hard delete financial records
6. Audit everything: Track all changes with audit logs
7. Normalize appropriately: Balance between normalization and query performance
8. Use stored procedures: For complex calculations and business logic
9. Monitor performance: Regular query analysis and optimization
10. Regular backups: Daily full backups, point-in-time recovery capability
