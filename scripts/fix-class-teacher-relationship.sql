-- Fix script for class-teacher relationship
-- This script ensures the proper foreign key relationship exists

-- 1. First, let's check if the foreign key constraint exists
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'classes' 
        AND constraint_name LIKE '%class_teacher_id%'
    ) THEN
        -- Add the foreign key constraint if it doesn't exist
        ALTER TABLE classes 
        ADD CONSTRAINT classes_class_teacher_id_fkey 
        FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint classes_class_teacher_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- 2. Verify the constraint was created
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
    AND tc.table_name = 'classes'
    AND kcu.column_name = 'class_teacher_id';

-- 3. Test the relationship with a simple query
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_teacher_id,
    t.first_name,
    t.last_name
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
LIMIT 5;
