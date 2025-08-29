-- Quick Fix for Invalid Class References
-- This script quickly fixes the "Form 4" type errors by cleaning invalid references

-- Step 1: Show what we're dealing with
SELECT 'Current invalid class references:' as status;
SELECT 
    COUNT(*) as invalid_count
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Step 2: Show examples of the invalid data
SELECT 'Examples of invalid data:' as info;
SELECT 
    first_name,
    last_name,
    class as invalid_class_reference
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
LIMIT 5;

-- Step 3: Clean up invalid references (set them to NULL)
UPDATE students 
SET class = NULL 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Step 4: Verify cleanup
SELECT 'After cleanup - remaining invalid references:' as status;
SELECT 
    COUNT(*) as remaining_invalid
FROM students 
WHERE class IS NOT NULL 
  AND class != '' 
  AND class NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Step 5: Show current state
SELECT 'Current state:' as status;
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

SELECT 'Quick fix completed - invalid references cleaned up' as status;
