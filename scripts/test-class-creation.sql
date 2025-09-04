-- Test Class Creation Functionality
-- This script tests the class creation process and verifies data is saved correctly

-- First, let's check if our tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'classes' THEN '✅ Classes table exists'
        WHEN table_name = 'class_subjects' THEN '✅ Class subjects table exists'
        ELSE '❌ Table missing: ' || table_name
    END as status
FROM information_schema.tables 
WHERE table_name IN ('classes', 'class_subjects')
AND table_schema = 'public';

-- Check the structure of the classes table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the structure of the class_subjects table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_subjects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test inserting a sample class
INSERT INTO classes (
    class_name, 
    class_level, 
    stream, 
    subsystem, 
    academic_year, 
    capacity, 
    current_enrollment, 
    status
) VALUES (
    'Test Form 1A',
    'Form 1',
    'grammar',
    'english',
    '2024/2025',
    40,
    0,
    'active'
) ON CONFLICT DO NOTHING
RETURNING id, class_name, class_level, stream, subsystem, academic_year, capacity, status;

-- Test inserting subjects for the test class
WITH test_class AS (
    SELECT id FROM classes WHERE class_name = 'Test Form 1A' LIMIT 1
)
INSERT INTO class_subjects (class_id, subject_name, academic_year)
SELECT 
    tc.id,
    unnest(ARRAY['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics']),
    '2024/2025'
FROM test_class tc
ON CONFLICT DO NOTHING;

-- Verify the test data was inserted correctly
SELECT 
    c.id,
    c.class_name,
    c.class_level,
    c.stream,
    c.subsystem,
    c.academic_year,
    c.capacity,
    c.status,
    array_agg(cs.subject_name ORDER BY cs.subject_name) as subjects
FROM classes c
LEFT JOIN class_subjects cs ON c.id = cs.class_id
WHERE c.class_name = 'Test Form 1A'
GROUP BY c.id, c.class_name, c.class_level, c.stream, c.subsystem, c.academic_year, c.capacity, c.status;

-- Clean up test data
DELETE FROM class_subjects WHERE class_id IN (SELECT id FROM classes WHERE class_name = 'Test Form 1A');
DELETE FROM classes WHERE class_name = 'Test Form 1A';

-- Show current classes count
SELECT 
    'Current classes in database:' as info,
    COUNT(*) as total_classes
FROM classes;

-- Show current subjects count
SELECT 
    'Current class-subject relationships:' as info,
    COUNT(*) as total_relationships
FROM class_subjects;
