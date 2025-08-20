-- Verify Classes Table Setup
-- This script checks if the classes table exists and has the correct structure

-- Check if the classes table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'classes'
        ) 
        THEN '✅ Classes table exists'
        ELSE '❌ Classes table does not exist'
    END as table_status;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'classes'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'classes';

-- Check if sample data exists
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_classes,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_classes
FROM classes;

-- Display sample data
SELECT 
    class_name,
    class_level,
    stream,
    subsystem,
    academic_year,
    capacity,
    current_enrollment,
    status,
    created_at
FROM classes
ORDER BY created_at DESC
LIMIT 5;
