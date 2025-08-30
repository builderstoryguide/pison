-- Test Teacher Deletion Functionality
-- This script helps debug teacher deletion issues

-- 1. Check if teachers table exists and has data
SELECT 'Checking teachers table structure...' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- 2. Check current teachers count
SELECT 'Current teachers count:' as info, COUNT(*) as teacher_count FROM teachers;

-- 3. Show sample teacher data
SELECT 'Sample teacher data:' as info;
SELECT id, teacher_id, first_name, last_name, email, status 
FROM teachers 
LIMIT 5;

-- 4. Check RLS policies on teachers table
SELECT 'RLS policies on teachers table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teachers';

-- 5. Test deletion of a specific teacher (replace with actual teacher ID)
-- SELECT 'Testing teacher deletion...' as info;
-- DELETE FROM teachers WHERE id = 'your-teacher-id-here';
-- SELECT 'Teacher deleted successfully' as result;

-- 6. Check if there are any foreign key constraints
SELECT 'Foreign key constraints on teachers table:' as info;
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
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='teachers';

-- 7. Check if there are any triggers on the teachers table
SELECT 'Triggers on teachers table:' as info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teachers';
