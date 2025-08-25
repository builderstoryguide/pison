# Financial Errors Debugging Guide

## Problem Description

You're experiencing errors when loading financial data:
- "Error loading payments: {}"
- "Error loading student fee assignments: {}"

These errors occur in `lib/financial-context.tsx` and indicate that the database queries are failing but not providing detailed error information.

## Root Cause Analysis

The empty error objects `{}` suggest several possible issues:

1. **Database Connection Issues**
   - Supabase client not properly initialized
   - Environment variables missing or incorrect
   - Network connectivity problems

2. **Table Schema Issues**
   - Missing tables
   - Incorrect column names
   - Foreign key constraint violations

3. **Permission Issues**
   - Row Level Security (RLS) policies blocking access
   - Insufficient user permissions
   - Authentication problems

4. **Data Issues**
   - Orphaned records with invalid foreign keys
   - Null values in required fields
   - Data type mismatches

## Debugging Steps

### Step 1: Check Environment Variables

Verify that your `.env.local` file contains the correct Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Test Database Connection

Run the diagnostic SQL script to check your database:

```bash
# Connect to your Supabase database and run:
\i scripts/diagnose-financial-errors.sql
```

### Step 3: Check Browser Console

Open your browser's developer tools and look for:

1. **Network Tab**: Check if API calls are being made
2. **Console Tab**: Look for detailed error messages
3. **Application Tab**: Check if Supabase client is initialized

### Step 4: Enhanced Error Logging

The updated `financial-context.tsx` now includes detailed error logging. Check the console for:

- Database connection test results
- Detailed error messages with codes and hints
- Query execution status
- Record counts for each table

## Common Issues and Solutions

### Issue 1: Missing Tables

**Symptoms**: Error messages about tables not existing

**Solution**: Run the database setup scripts:

```sql
-- Run the financial schema setup
\i scripts/create-financial-tables.sql

-- Run the bursar reports setup
\i scripts/bursar-reports-setup.sql

-- Run the enhanced bursar reports setup
\i scripts/enhanced-bursar-reports.sql
```

### Issue 2: Column Name Mismatches

**Symptoms**: Errors about missing columns

**Solution**: Check the actual column names in your database:

```sql
-- Check payments table structure
\d payments;

-- Check student_fee_assignments table structure
\d student_fee_assignments;
```

### Issue 3: Foreign Key Violations

**Symptoms**: Errors about constraint violations

**Solution**: Fix orphaned records:

```sql
-- Remove orphaned payments
DELETE FROM payments 
WHERE student_id NOT IN (SELECT id FROM students);

-- Remove orphaned student_fee_assignments
DELETE FROM student_fee_assignments 
WHERE student_id NOT IN (SELECT id FROM students);
```

### Issue 4: RLS Policy Issues

**Symptoms**: No data returned despite tables having data

**Solution**: Check and update RLS policies:

```sql
-- Disable RLS temporarily for testing
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments DISABLE ROW LEVEL SECURITY;

-- Or create appropriate policies
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');
```

### Issue 5: Missing Data

**Symptoms**: Empty results from queries

**Solution**: Insert sample data:

```sql
-- Insert sample payment methods
INSERT INTO payment_methods (name, code) VALUES 
('Cash', 'CASH'),
('Bank Transfer', 'BANK'),
('Mobile Money', 'MOMO')
ON CONFLICT (code) DO NOTHING;

-- Insert sample fee structures
INSERT INTO fee_structures (name, subsystem, level, branch, amount, term, academic_year) VALUES 
('Form 1 English Grammar', 'english', 'form1', 'grammar', 50000, 'first', '2024-2025')
ON CONFLICT DO NOTHING;
```

## Testing the Fix

After applying fixes:

1. **Clear browser cache** (Ctrl+F5)
2. **Check console logs** for detailed error information
3. **Test API endpoints** directly:
   ```bash
   curl "http://localhost:3000/api/bursar/payment-methods?isActive=true"
   ```
4. **Verify data loading** in the application

## Prevention

To prevent similar issues:

1. **Database Migrations**: Use proper migration scripts
2. **Environment Validation**: Validate environment variables on startup
3. **Error Handling**: Implement comprehensive error handling
4. **Testing**: Test database queries with sample data
5. **Monitoring**: Monitor database connection health

## Support

If issues persist:

1. **Check Supabase Dashboard**: Verify project status and logs
2. **Review Network Requests**: Check browser network tab for failed requests
3. **Test Direct Database Access**: Use Supabase SQL editor to test queries
4. **Check Authentication**: Verify user authentication status

## Quick Fix Checklist

- [ ] Environment variables set correctly
- [ ] Database tables exist and have correct structure
- [ ] Sample data inserted for testing
- [ ] RLS policies configured properly
- [ ] Foreign key relationships valid
- [ ] API routes working correctly
- [ ] Browser cache cleared
- [ ] Console errors reviewed

## Emergency Fallback

If database issues persist, the application will fall back to mock data:

```typescript
if (!supabase) {
  console.warn("Supabase client not available - using mock data")
  setPayments([])
  setStudentFeeAssignments([])
  setFeeStructures([])
  return
}
```

This ensures the application remains functional while database issues are resolved.
