-- Check Fee Structures Table
-- This script helps debug fee structure creation issues

-- 1. Check if fee_structures table exists
SELECT 'Checking fee_structures table existence...' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fee_structures'
) as table_exists;

-- 2. Check table structure
SELECT 'Fee structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- 3. Check current fee structures count
SELECT 'Current fee structures count:' as info, COUNT(*) as fee_structures_count FROM fee_structures;

-- 4. Show sample fee structures data
SELECT 'Sample fee structures data:' as info;
SELECT * FROM fee_structures 
LIMIT 5;

-- 5. Check RLS policies on fee_structures table
SELECT 'RLS policies on fee_structures table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';

-- 6. Check if there are any foreign key constraints
SELECT 'Foreign key constraints on fee_structures table:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='fee_structures';

-- 7. Test insertion of a sample fee structure (commented out for safety)
-- SELECT 'Testing fee structure insertion...' as info;
-- INSERT INTO fee_structures (
--   name, subsystem, level, branch, amount, due_date, term, academic_year, description, is_active
-- ) VALUES (
--   'Test Fee Structure', 'english', 'form-1', 'grammar', 50000, '2024-12-31', 'first', '2024-2025', 'Test description', true
-- );
-- SELECT 'Test fee structure inserted successfully' as result;
