-- =====================================================
-- Assignments Database Verification Script
-- =====================================================
-- Run this script to check if the assignments table is properly set up

-- Check if assignments table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'assignments'
        ) THEN '✅ Assignments table exists'
        ELSE '❌ Assignments table does not exist'
    END as table_status;

-- Check if assignment_submissions table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'assignment_submissions'
        ) THEN '✅ Assignment submissions table exists'
        ELSE '❌ Assignment submissions table does not exist'
    END as submissions_table_status;

-- Check assignments table structure (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'assignments'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'assignments';

-- Check permissions for authenticated users
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'assignments' 
AND grantee = 'authenticated';

-- If tables don't exist, show instructions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments'
    ) THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'ASSIGNMENTS TABLE NOT FOUND';
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'To fix this issue, run the following scripts:';
        RAISE NOTICE '1. scripts/setup-assignments-minimal.sql';
        RAISE NOTICE '2. scripts/quick-assignment-fix.sql';
        RAISE NOTICE '=====================================================';
    END IF;
END $$;
