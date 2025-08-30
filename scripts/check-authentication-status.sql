-- Check Authentication Status and RLS Policies
-- This script will help diagnose authentication and RLS issues

-- Check current user authentication status
SELECT 'Current authentication status:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_user_role,
    auth.email() as current_user_email;

-- Check if RLS is enabled on fee_structures table
SELECT 'RLS status on fee_structures table:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'fee_structures';

-- Show current RLS policies
SELECT 'Current RLS policies on fee_structures table:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';

-- Test authentication in different contexts
SELECT 'Testing authentication in different contexts:' as info;

-- Test 1: Check if we can read from fee_structures
SELECT 'Test 1 - Reading from fee_structures:' as test;
SELECT COUNT(*) as record_count FROM fee_structures;

-- Test 2: Check if we can insert into fee_structures (this might fail due to RLS)
SELECT 'Test 2 - Testing insert into fee_structures:' as test;
DO $$
BEGIN
    INSERT INTO fee_structures (
        name, 
        subsystem, 
        level, 
        branch, 
        amount, 
        due_date, 
        term, 
        academic_year, 
        description, 
        is_active
    ) VALUES (
        'RLS Test Fee Structure',
        'english',
        'Form 1',
        'grammar',
        50000.00,
        CURRENT_DATE + INTERVAL '30 days',
        'first',
        '2024-2025',
        'Test fee structure for RLS policy verification',
        true
    );
    RAISE NOTICE 'Insert successful - RLS policies are working';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert failed - RLS policy violation: %', SQLERRM;
END $$;

-- Clean up test record
DELETE FROM fee_structures WHERE name = 'RLS Test Fee Structure';

-- Show table structure to ensure all columns exist
SELECT 'Fee structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;
