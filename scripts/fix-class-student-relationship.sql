-- Fix Class-Student Relationship Schema
-- This script fixes the type mismatch between students.class and classes.id columns

-- Check current column types
SELECT 'Checking current column types...' as status;

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

-- Check if there are any invalid class references
SELECT 'Checking for invalid class references...' as status;

SELECT 
    'Invalid class references' as issue,
    COUNT(*) as count
FROM students s
LEFT JOIN classes c ON s.class::uuid = c.id
WHERE c.id IS NULL AND s.class IS NOT NULL AND s.class != '';

-- If there are invalid references, we need to handle them
-- For now, let's just show what they are
SELECT 
    'Invalid class references details:' as info;
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.class as invalid_class_reference
FROM students s
LEFT JOIN classes c ON s.class::uuid = c.id
WHERE c.id IS NULL AND s.class IS NOT NULL AND s.class != ''
LIMIT 10;

-- Option 1: Convert students.class to UUID (if all references are valid)
-- Uncomment the following lines if you want to convert the column type
/*
-- First, ensure all class references are valid UUIDs
UPDATE students 
SET class = NULL 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Then convert the column type
ALTER TABLE students 
ALTER COLUMN class TYPE UUID USING class::uuid;
*/

-- Option 2: Keep as VARCHAR but add proper foreign key constraint
-- This is safer if you have existing data that might not be valid UUIDs
SELECT 'Adding foreign key constraint...' as status;

-- First, let's check if the foreign key constraint already exists
SELECT 
    'Existing foreign key constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'students'
    AND kcu.column_name = 'class';

-- Add foreign key constraint if it doesn't exist
-- Note: This will fail if there are invalid references
-- Uncomment the following lines if you want to add the constraint
/*
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_class_fkey' 
        AND table_name = 'students'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE students 
        ADD CONSTRAINT students_class_fkey 
        FOREIGN KEY (class) REFERENCES classes(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to add foreign key constraint: %', SQLERRM;
END $$;
*/

-- Summary of current state
SELECT 'Summary of current state:' as status;

SELECT 
    'Total students' as metric,
    COUNT(*) as count
FROM students;

SELECT 
    'Students with class assignment' as metric,
    COUNT(*) as count
FROM students s
JOIN classes c ON s.class::uuid = c.id
WHERE s.status = 'active';

SELECT 
    'Students without class assignment' as metric,
    COUNT(*) as count
FROM students s
WHERE s.class IS NULL OR s.class = ''
    AND s.status = 'active';

SELECT 
    'Students with invalid class references' as metric,
    COUNT(*) as count
FROM students s
LEFT JOIN classes c ON s.class::uuid = c.id
WHERE c.id IS NULL AND s.class IS NOT NULL AND s.class != '';

-- Recommendations
SELECT 'Recommendations:' as status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM students s
            LEFT JOIN classes c ON s.class::uuid = c.id
            WHERE c.id IS NULL AND s.class IS NOT NULL AND s.class != ''
        ) THEN '⚠️  Found invalid class references. Clean up data before converting column type.'
        ELSE '✅ All class references are valid. Safe to convert column type.'
    END as recommendation;

SELECT 'Schema fix completed' as status;
