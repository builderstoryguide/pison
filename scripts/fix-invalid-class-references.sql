-- Fix Invalid Class References
-- This script handles the case where students.class contains class names instead of UUIDs

-- First, let's see what invalid data we have
SELECT 'Checking for invalid class references...' as status;

SELECT 
    'Invalid class references found' as issue,
    COUNT(*) as count
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Show examples of invalid data
SELECT 
    'Examples of invalid class references:' as info;
SELECT 
    id as student_id,
    first_name,
    last_name,
    class as invalid_class_reference
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
LIMIT 10;

-- Check what classes exist in the classes table
SELECT 'Available classes in database:' as info;
SELECT 
    id as class_uuid,
    class_name,
    class_level,
    subsystem
FROM classes 
ORDER BY class_name;

-- Option 1: Try to match class names to existing classes
-- This will attempt to find matching classes based on class names
SELECT 'Attempting to match class names to existing classes...' as status;

-- Create a mapping of class names to UUIDs
WITH class_mapping AS (
    SELECT 
        class_name,
        id as class_uuid
    FROM classes
)
SELECT 
    'Potential matches found:' as info;
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.class as current_class_reference,
    c.class_name as matched_class_name,
    c.id as matched_class_uuid
FROM students s
LEFT JOIN class_mapping c ON LOWER(s.class) = LOWER(c.class_name)
WHERE s.class IS NOT NULL 
  AND s.class != '' 
  AND s.class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  AND c.class_uuid IS NOT NULL
LIMIT 10;

-- Option 2: Clean up invalid references by setting them to NULL
-- Uncomment the following lines if you want to remove invalid references
/*
UPDATE students 
SET class = NULL 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

SELECT 'Invalid class references cleaned up' as status;
*/

-- Option 3: Try to match and update class references
-- This is more complex and should be done carefully
-- Uncomment the following lines if you want to attempt automatic matching
/*
-- First, create a temporary table to store the mappings
CREATE TEMP TABLE class_name_mapping AS
SELECT 
    LOWER(class_name) as class_name_lower,
    id as class_uuid
FROM classes;

-- Update students with matching class names
UPDATE students 
SET class = cm.class_uuid::text
FROM class_name_mapping cm
WHERE LOWER(students.class) = cm.class_name_lower
  AND students.class IS NOT NULL 
  AND students.class != '' 
  AND students.class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Clean up any remaining invalid references
UPDATE students 
SET class = NULL 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

SELECT 'Class references updated and cleaned' as status;
*/

-- Check the current state after cleanup
SELECT 'Current state after cleanup:' as status;

SELECT 
    'Students with valid UUID class references' as metric,
    COUNT(*) as count
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

SELECT 
    'Students without class assignment' as metric,
    COUNT(*) as count
FROM students 
WHERE class IS NULL OR class = '';

SELECT 
    'Students with invalid class references (remaining)' as metric,
    COUNT(*) as count
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Recommendations
SELECT 'Recommendations:' as status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM students 
            WHERE class IS NOT NULL 
              AND class != '' 
              AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        ) THEN '⚠️  Still have invalid class references. Choose an option above to clean them up.'
        ELSE '✅ All class references are now valid UUIDs. Safe to convert column type.'
    END as recommendation;

-- If all references are now valid, you can convert the column type
-- Uncomment the following lines when ready to convert
/*
-- Convert students.class to UUID
ALTER TABLE students 
ALTER COLUMN class TYPE UUID USING class::uuid;

-- Add foreign key constraint
ALTER TABLE students 
ADD CONSTRAINT students_class_fkey 
FOREIGN KEY (class) REFERENCES classes(id) ON DELETE SET NULL;

SELECT 'Column type converted to UUID and foreign key constraint added' as status;
*/

SELECT 'Invalid class references fix completed' as status;
