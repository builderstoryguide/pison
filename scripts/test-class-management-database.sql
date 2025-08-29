-- Test Class Management Database Integration
-- This script verifies that all class management data is properly stored in the database

-- Check if required tables exist
SELECT 'Checking required tables...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('classes', 'students', 'teachers', 'users') 
        THEN 'Required table'
        ELSE 'Optional table'
    END as table_type,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('classes', 'students', 'teachers', 'users', 'attendance_sessions', 'attendance_records')
ORDER BY table_name;

-- Check classes table structure
SELECT 'Checking classes table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check students table structure
SELECT 'Checking students table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check teachers table structure
SELECT 'Checking teachers table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if classes have data
SELECT 'Checking classes data...' as status;

SELECT COUNT(*) as total_classes FROM classes;
SELECT COUNT(*) as active_classes FROM classes WHERE status = 'active';
SELECT COUNT(*) as classes_with_teachers FROM classes WHERE class_teacher_id IS NOT NULL;

-- Check if students have data
SELECT 'Checking students data...' as status;

SELECT COUNT(*) as total_students FROM students;
SELECT COUNT(*) as active_students FROM students WHERE status = 'active';
SELECT COUNT(*) as students_with_classes FROM students WHERE class IS NOT NULL;

-- Check if teachers have data
SELECT 'Checking teachers data...' as status;

SELECT COUNT(*) as total_teachers FROM teachers;
SELECT COUNT(*) as active_teachers FROM teachers WHERE status = 'active';

-- Test class-teacher relationships
SELECT 'Testing class-teacher relationships...' as status;

SELECT 
    'Classes with assigned teachers' as relationship,
    COUNT(*) as count
FROM classes c
JOIN teachers t ON c.class_teacher_id = t.id
WHERE c.status = 'active';

SELECT 
    'Classes without assigned teachers' as relationship,
    COUNT(*) as count
FROM classes c
WHERE c.class_teacher_id IS NULL AND c.status = 'active';

-- Test class-student relationships
SELECT 'Testing class-student relationships...' as status;

-- First, let's check the data types of the columns
SELECT 'Checking column types...' as info;
SELECT 
    'students.class' as column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'class';

SELECT 
    'classes.id' as column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' AND column_name = 'id';

-- Test class-student relationships with proper type handling
SELECT 
    'Students assigned to classes' as relationship,
    COUNT(*) as count
FROM students s
JOIN classes c ON s.class::uuid = c.id
WHERE s.status = 'active';

SELECT 
    'Students without class assignment' as relationship,
    COUNT(*) as count
FROM students s
WHERE s.class IS NULL AND s.status = 'active';

-- Check class enrollment counts
SELECT 'Checking class enrollment accuracy...' as status;

SELECT 
    c.class_name,
    c.current_enrollment as stored_enrollment,
    COUNT(s.id) as actual_students,
    CASE 
        WHEN c.current_enrollment = COUNT(s.id) THEN '✓ Accurate'
        ELSE '✗ Mismatch'
    END as enrollment_status
FROM classes c
LEFT JOIN students s ON c.id = s.class::uuid AND s.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id, c.class_name, c.current_enrollment
ORDER BY c.class_name;

-- Check for orphaned records
SELECT 'Checking for orphaned records...' as status;

-- Orphaned students (assigned to non-existent classes)
SELECT 
    'Orphaned students' as issue,
    COUNT(*) as count
FROM students s
LEFT JOIN classes c ON s.class::uuid = c.id
WHERE c.id IS NULL AND s.class IS NOT NULL;

-- Classes with invalid teacher assignments
SELECT 
    'Classes with invalid teacher assignments' as issue,
    COUNT(*) as count
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
WHERE t.id IS NULL AND c.class_teacher_id IS NOT NULL;

-- Check attendance data if available
SELECT 'Checking attendance data...' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_sessions' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as attendance_sessions_table_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_records' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as attendance_records_table_status;

-- Sample data verification
SELECT 'Sample data verification...' as status;

-- Sample classes
SELECT 'Sample Classes:' as info;
SELECT 
    class_name,
    class_level,
    subsystem,
    stream as branch,
    capacity,
    current_enrollment,
    status
FROM classes 
ORDER BY class_name 
LIMIT 5;

-- Sample students
SELECT 'Sample Students:' as info;
SELECT 
    first_name,
    last_name,
    student_id,
    status,
    class
FROM students 
ORDER BY first_name, last_name 
LIMIT 5;

-- Sample teachers
SELECT 'Sample Teachers:' as info;
SELECT 
    first_name,
    last_name,
    email,
    status
FROM teachers 
ORDER BY first_name, last_name 
LIMIT 5;

-- Summary
SELECT 'Class management database test completed' as status;
