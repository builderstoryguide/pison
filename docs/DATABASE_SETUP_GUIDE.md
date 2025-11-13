# Employee Management Database Setup Guide

## Quick Setup Guide

This guide will walk you through setting up the database schema for the Employee Management system.

## Prerequisites

- ✅ PostgreSQL database already set up
- ✅ Existing `teachers` table with data
- ✅ Access to database with sufficient privileges
- ✅ `psql` command-line tool or database client

## Setup Steps

### Step 1: Backup Your Database ⚠️

**IMPORTANT**: Always backup before running migrations!

```bash
# Using pg_dump
pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using your database client's backup feature
```

### Step 2: Run the Schema Migration

#### Option A: Using psql command line

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the migration script
psql -U your_username -d your_database -f scripts/2025-11-13_030_employee_management_schema.sql
```

#### Option B: Using Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `scripts/2025-11-13_030_employee_management_schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

#### Option C: Using pgAdmin or other GUI client

1. Open your database client
2. Connect to your database
3. Open a new query window
4. Load the file `scripts/2025-11-13_030_employee_management_schema.sql`
5. Execute the query

### Step 3: Verify Installation

After running the migration, you should see output like:

```
========================================
EMPLOYEE MANAGEMENT SCHEMA VERIFICATION
========================================
✓ Teachers table extended successfully
✓ leave_requests table created successfully
✓ attendance_records table created successfully
✓ performance_reviews table created successfully
✓ payroll_records table created successfully
✓ leave_balances table created successfully
========================================
Schema setup complete!
========================================
```

### Step 4: Verify Tables Exist

Run this query to check all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'teachers', 
    'leave_requests', 
    'attendance_records', 
    'performance_reviews', 
    'payroll_records', 
    'leave_balances'
)
ORDER BY table_name;
```

You should see all 6 tables listed.

### Step 5: (Optional) Insert Sample Data

For testing purposes, you can insert sample data:

```bash
psql -U your_username -d your_database -f scripts/2025-11-13_031_employee_management_sample_data.sql
```

**Note**: Sample data is for development/testing only. Skip this step in production.

## What Gets Created

### 1. Extended Teachers Table

New columns added:
- `end_date` - Contract end date
- `contract_renewal_date` - Contract renewal date  
- `department` - Employee department
- `specialization` - Area of specialization
- `emergency_contact_email` - Emergency contact email
- `emergency_contact_address` - Emergency contact address
- `postal_code` - Postal code
- `country` - Country (default: Cameroon)
- `is_verified` - Verification status
- `profile_completed` - Profile completion status

Updated constraints:
- `employment_type` now includes "temporary"
- `status` now includes "terminated" and "retired"

### 2. New Tables Created

| Table Name | Purpose |
|------------|---------|
| `leave_requests` | Leave request management and approval workflow |
| `attendance_records` | Daily attendance tracking |
| `performance_reviews` | Performance evaluation and reviews |
| `payroll_records` | Monthly payroll processing |
| `leave_balances` | Annual leave balance tracking |

## Database Size Impact

Estimated additional space:

- **Tables**: ~50KB empty
- **Indexes**: ~30KB per table
- **With 100 employees**:
  - Leave requests: ~1MB/year
  - Attendance: ~2MB/year
  - Payroll: ~500KB/year
  - Performance reviews: ~300KB/year

**Total**: Approximately 4-5MB per year for 100 employees

## Post-Installation Tasks

### 1. Initialize Leave Balances

Create leave balances for all active employees:

```sql
INSERT INTO public.leave_balances (
    employee_id,
    year,
    annual_leave_total,
    annual_leave_remaining,
    sick_leave_total,
    sick_leave_remaining
)
SELECT 
    id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    30,  -- annual leave days
    30,
    14,  -- sick leave days
    14
FROM public.teachers
WHERE status = 'active'
ON CONFLICT (employee_id, year) DO NOTHING;
```

### 2. Update Department Information

Assign departments to existing employees:

```sql
UPDATE public.teachers
SET department = 'Mathematics'
WHERE subjects && ARRAY['Mathematics'];

UPDATE public.teachers
SET department = 'Sciences'
WHERE subjects && ARRAY['Physics', 'Chemistry', 'Biology'];

UPDATE public.teachers
SET department = 'Languages'
WHERE subjects && ARRAY['English', 'French'];

-- Continue for other departments...
```

### 3. Verify Data Integrity

Check that all relationships are correct:

```sql
-- Check for employees without leave balances
SELECT t.teacher_id, t.first_name, t.last_name
FROM teachers t
LEFT JOIN leave_balances lb ON t.id = lb.employee_id 
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE t.status = 'active' 
AND lb.id IS NULL;
```

## Troubleshooting

### Error: Column Already Exists

If you see errors about columns already existing:

```sql
-- Check existing columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;
```

The script uses `IF NOT EXISTS` checks, so it should be safe to re-run.

### Error: Foreign Key Constraint Failed

If foreign key errors occur, ensure:

1. The `users` table exists
2. The `teachers` table exists and has the `id` column

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'teachers');
```

### Error: Permission Denied

If you get permission errors:

```sql
-- Check your role permissions
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = CURRENT_USER;

-- Grant necessary permissions (as superuser)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
```

### Error: UUID Extension Not Available

If UUID generation fails:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- or
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Rolling Back

If you need to undo the migration:

### Remove New Tables Only

```sql
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.payroll_records CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
```

### Remove New Columns (Optional)

```sql
ALTER TABLE public.teachers 
    DROP COLUMN IF EXISTS end_date,
    DROP COLUMN IF EXISTS contract_renewal_date,
    DROP COLUMN IF EXISTS department,
    DROP COLUMN IF EXISTS specialization,
    DROP COLUMN IF EXISTS emergency_contact_email,
    DROP COLUMN IF EXISTS emergency_contact_address,
    DROP COLUMN IF EXISTS postal_code,
    DROP COLUMN IF EXISTS country,
    DROP COLUMN IF EXISTS is_verified,
    DROP COLUMN IF EXISTS profile_completed;
```

**Note**: Dropping columns will lose data. Only do this if absolutely necessary.

## Security Checklist

After installation, verify:

- [ ] RLS is enabled on all tables
- [ ] Appropriate policies are in place
- [ ] Foreign key constraints are working
- [ ] Indexes are created properly
- [ ] Triggers are functioning
- [ ] Only authorized users can access sensitive data (payroll, etc.)

## Performance Tuning

For large datasets (>1000 employees):

```sql
-- Analyze tables for query optimization
ANALYZE public.teachers;
ANALYZE public.leave_requests;
ANALYZE public.attendance_records;
ANALYZE public.performance_reviews;
ANALYZE public.payroll_records;
ANALYZE public.leave_balances;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

## Backup Strategy

After successful migration:

1. **Immediate Backup**: Take a full backup
2. **Regular Backups**: Schedule daily backups
3. **Test Restore**: Verify backups can be restored

```bash
# Automated daily backup example
pg_dump -U your_username -d your_database > \
    /backups/database_$(date +%Y%m%d).sql
```

## Next Steps

After database setup:

1. ✅ Restart your application to pick up schema changes
2. ✅ Test the Employee Management interface
3. ✅ Initialize leave balances for all employees
4. ✅ Configure leave policies and payroll settings
5. ✅ Train staff on new features

## Getting Help

If you encounter issues:

1. Check the logs for error messages
2. Review the troubleshooting section above
3. Verify prerequisites are met
4. Check database permissions
5. Contact your database administrator

## Documentation References

- **Full Schema Documentation**: `docs/employee-management-database-schema.md`
- **Feature Documentation**: `docs/employee-management-feature.md`
- **Quick Start Guide**: `docs/employee-management-quick-start.md`

---

**Important**: Always test migrations in a development environment before applying to production!

**Last Updated**: November 2024  
**Version**: 1.0.0

