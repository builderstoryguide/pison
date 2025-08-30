-- Test Database Connection and Tables
-- Run this in your Supabase SQL Editor to test the setup

-- Test 1: Check if basic tables exist
SELECT 'Testing table existence...' as test_step;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('classes', 'teachers', 'students') THEN '✅ Found'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'teachers', 'students')
ORDER BY table_name;

-- Test 2: Check if classes table has the required columns
SELECT 'Testing classes table structure...' as test_step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'class_name', 'class_level', 'subsystem', 'academic_year') THEN '✅ Required'
        WHEN column_name = 'class_teacher_id' THEN '🔗 Foreign Key'
        ELSE '📝 Optional'
    END as importance
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- Test 3: Check foreign key relationships
SELECT 'Testing foreign key relationships...' as test_step;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.table_name = 'classes' AND ccu.table_name = 'teachers' THEN '✅ Classes-Teachers relationship'
        ELSE '📝 Other relationship'
    END as relationship_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('classes', 'teachers', 'students');

-- Test 4: Try to insert a test class
SELECT 'Testing class insertion...' as test_step;

-- First, ensure we have at least one teacher
INSERT INTO teachers (teacher_id, first_name, last_name, email, subsystem, employment_type, status)
SELECT 
    'TCH_TEST',
    'Test',
    'Teacher',
    'test.teacher@school.com',
    'english',
    'full-time',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_id = 'TCH_TEST');

-- Get a teacher ID for the test
DO $$
DECLARE
    teacher_uuid UUID;
BEGIN
    SELECT id INTO teacher_uuid FROM teachers WHERE teacher_id = 'TCH_TEST' LIMIT 1;
    
    -- Try to insert a test class
    INSERT INTO classes (class_name, class_level, subsystem, academic_year, class_teacher_id, status)
    VALUES ('Test Class', 'Form 1', 'english', '2024-25', teacher_uuid, 'active')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test class insertion completed successfully';
END $$;

-- Test 5: Try to query classes with teacher information
SELECT 'Testing class-teacher join...' as test_step;

SELECT 
    c.class_name,
    c.class_level,
    c.subsystem,
    t.first_name || ' ' || t.last_name as teacher_name,
    CASE 
        WHEN t.id IS NOT NULL THEN '✅ Join successful'
        ELSE '❌ Join failed'
    END as join_status
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
LIMIT 5;

-- Test 6: Summary
SELECT 'Database test summary:' as summary;

SELECT 
    'Tables exist' as test,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'teachers', 'students')

UNION ALL

SELECT 
    'Classes with teachers' as test,
    COUNT(*) as result
FROM classes c
JOIN teachers t ON c.class_teacher_id = t.id

UNION ALL

SELECT 
    'Total classes' as test,
    COUNT(*) as result
FROM classes;
