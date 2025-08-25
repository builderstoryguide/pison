# Bursar Login Error Fix Guide

## Problem Description

When signing in as a Bursar, you encounter the error:
```
Error loading payments: {}
```

This error occurs in `lib/financial-context.tsx` at line 317 and is caused by missing database tables and schema mismatches.

## Root Cause

The issue is caused by:

1. **Missing `payment_methods` table** - Referenced in enhanced bursar reports but not created in the base financial schema
2. **Schema mismatch** - The `financial-context.tsx` expects certain columns and relationships that don't exist in the database
3. **Missing columns** - The `payments` table is missing `payment_method_id`, `received_by`, `academic_year`, and `term` columns

## Solution

### Step 1: Run Database Schema Fixes

Execute the following SQL script to fix the database schema:

```sql
-- Run this in your PostgreSQL database
\i scripts/fix-financial-schema.sql
```

Or run the individual commands:

```sql
-- Create missing payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, code, description) VALUES
    ('Cash', 'CASH', 'Cash payment'),
    ('Bank Transfer', 'BANK_TRANSFER', 'Bank transfer payment'),
    ('Mobile Money', 'MOBILE_MONEY', 'Mobile money payment'),
    ('Cheque', 'CHEQUE', 'Cheque payment')
ON CONFLICT (code) DO NOTHING;

-- Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS term VARCHAR(20);

-- Update existing data
UPDATE payments 
SET payment_method_id = (SELECT id FROM payment_methods WHERE code = 'CASH' LIMIT 1)
WHERE payment_method_id IS NULL;

UPDATE payments p
SET 
    academic_year = fs.academic_year,
    term = fs.term
FROM fee_structures fs
WHERE p.fee_structure_id = fs.id 
AND (p.academic_year IS NULL OR p.term IS NULL);
```

### Step 2: Verify the Fix

After running the schema fixes, verify that all tables exist:

```sql
-- Check if all required tables exist
SELECT table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) 
            THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (VALUES 
    ('payment_methods'),
    ('payments'),
    ('fee_structures'),
    ('student_fee_assignments')
) AS t(table_name);
```

### Step 3: Test Bursar Login

1. Sign out of the application
2. Sign in as a Bursar
3. Verify that the dashboard loads without errors
4. Check that financial data is displayed correctly

## What Was Fixed

### Database Schema
- ✅ Created missing `payment_methods` table
- ✅ Added `payment_method_id` column to `payments` table
- ✅ Added `received_by` column to `payments` table
- ✅ Added `academic_year` and `term` columns to `payments` table
- ✅ Created necessary indexes for performance
- ✅ Updated existing data with default values

### Code Changes
- ✅ Fixed `financial-context.tsx` to handle null data gracefully
- ✅ Updated queries to include `payment_methods` join
- ✅ Added fallback values for missing data
- ✅ Improved error handling

## Prevention

To prevent similar issues in the future:

1. **Always run database setup scripts in order**:
   - `scripts/create-financial-tables.sql`
   - `scripts/fix-financial-schema.sql`
   - `scripts/enhanced-bursar-reports-part1.sql`
   - `scripts/enhanced-bursar-reports-part2.sql`

2. **Test database schema before deploying**:
   ```sql
   -- Verify all required tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('payment_methods', 'payments', 'fee_structures', 'student_fee_assignments');
   ```

3. **Check for missing columns**:
   ```sql
   -- Verify all required columns exist in payments table
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'payments' 
   AND column_name IN ('payment_method_id', 'received_by', 'academic_year', 'term');
   ```

## Troubleshooting

If you still encounter issues after applying the fixes:

1. **Check database connection**:
   ```sql
   SELECT current_database(), current_user;
   ```

2. **Verify table permissions**:
   ```sql
   SELECT table_name, privilege_type 
   FROM information_schema.table_privileges 
   WHERE table_name IN ('payment_methods', 'payments', 'fee_structures', 'student_fee_assignments');
   ```

3. **Check for data consistency**:
   ```sql
   -- Verify payment methods exist
   SELECT COUNT(*) FROM payment_methods;
   
   -- Verify payments have payment_method_id
   SELECT COUNT(*) FROM payments WHERE payment_method_id IS NULL;
   ```

4. **Review application logs** for additional error details.

## Files Modified

- `scripts/fix-financial-schema.sql` - Database schema fixes
- `lib/financial-context.tsx` - Code fixes for null data handling
- `docs/bursar-login-error-fix.md` - This documentation

## Support

If you continue to experience issues after following this guide, please:

1. Check the browser console for additional error messages
2. Review the database logs for any SQL errors
3. Verify that all database migrations have been applied successfully
4. Contact the development team with the specific error messages and steps to reproduce
