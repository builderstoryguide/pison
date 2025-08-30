-- Test script to verify class-teacher relationship
-- This script will help diagnose the relationship issue

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('classes', 'teachers')
ORDER BY table_name;

-- 2. Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'classes';

-- 3. Check if there are any classes in the database
SELECT COUNT(*) as class_count FROM classes;

-- 4. Check if there are any teachers in the database
SELECT COUNT(*) as teacher_count FROM teachers;

-- 5. Test a simple join query
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_teacher_id,
    t.first_name,
    t.last_name
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
LIMIT 5;

-- 6. Check the actual constraint name that PostgreSQL generated
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid = 'classes'::regclass
    AND contype = 'f';
