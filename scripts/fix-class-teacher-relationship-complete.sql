-- Complete fix for class-teacher relationship issue
-- This script resolves the database schema problems causing the query errors

-- 1. First, check if both tables exist
DO $$
DECLARE
    classes_exists BOOLEAN;
    teachers_exists BOOLEAN;
BEGIN
    -- Check if classes table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'classes'
    ) INTO classes_exists;
    
    -- Check if teachers table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teachers'
    ) INTO teachers_exists;
    
    IF NOT classes_exists THEN
        RAISE NOTICE 'Classes table does not exist. Creating it now...';
    ELSE
        RAISE NOTICE 'Classes table exists';
    END IF;
    
    IF NOT teachers_exists THEN
        RAISE NOTICE 'Teachers table does not exist. Please create it first.';
    ELSE
        RAISE NOTICE 'Teachers table exists';
    END IF;
END $$;

-- 2. Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) NOT NULL,
    stream VARCHAR(50) CHECK (stream IN ('grammar', 'technical', 'commercial')),
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 40 CHECK (capacity > 0 AND capacity <= 100),
    current_enrollment INTEGER DEFAULT 0 CHECK (current_enrollment >= 0),
    class_teacher_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Check if the foreign key constraint exists and add it if missing
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'classes' 
        AND constraint_name = 'classes_class_teacher_id_fkey'
    ) THEN
        -- Check if teachers table exists before adding constraint
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teachers') THEN
            -- Add the foreign key constraint
            ALTER TABLE classes 
            ADD CONSTRAINT classes_class_teacher_id_fkey 
            FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Added foreign key constraint classes_class_teacher_id_fkey';
        ELSE
            RAISE NOTICE 'Cannot add foreign key constraint: teachers table does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'Foreign key constraint classes_class_teacher_id_fkey already exists';
    END IF;
END $$;

-- 4. Create necessary indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_class_name ON classes(class_name);
CREATE INDEX IF NOT EXISTS idx_classes_class_level ON classes(class_level);
CREATE INDEX IF NOT EXISTS idx_classes_subsystem ON classes(subsystem);
CREATE INDEX IF NOT EXISTS idx_classes_stream ON classes(stream);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);
CREATE INDEX IF NOT EXISTS idx_classes_class_teacher_id ON classes(class_teacher_id);

-- 5. Create a function to test the relationship
CREATE OR REPLACE FUNCTION test_class_teacher_relationship()
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    teacher_id UUID,
    teacher_name TEXT,
    relationship_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.class_name::TEXT as class_name,
        c.class_teacher_id as teacher_id,
        COALESCE(t.first_name || ' ' || t.last_name, 'No Teacher Assigned')::TEXT as teacher_name,
        CASE 
            WHEN c.class_teacher_id IS NULL THEN 'No Teacher Assigned'::TEXT
            WHEN t.id IS NULL THEN 'Teacher Not Found'::TEXT
            ELSE 'Valid Relationship'::TEXT
        END as relationship_status
    FROM classes c
    LEFT JOIN teachers t ON c.class_teacher_id = t.id
    ORDER BY c.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 6. Test the relationship
SELECT 'Testing class-teacher relationship...' as message;
SELECT * FROM test_class_teacher_relationship();

-- 7. Show the current constraint information
SELECT 
    'Current foreign key constraints on classes table:' as message;

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

-- 8. Insert some sample data if the table is empty (optional)
DO $$
DECLARE
    class_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO class_count FROM classes;
    
    IF class_count = 0 THEN
        INSERT INTO classes (class_name, class_level, stream, subsystem, academic_year, capacity, current_enrollment, status) VALUES
        ('Form 1A', 'Form 1', 'grammar', 'english', '2024/2025', 40, 35, 'active'),
        ('Form 2B', 'Form 2', 'technical', 'english', '2024/2025', 35, 32, 'active'),
        ('Form 5 Science', 'Form 5', 'grammar', 'english', '2024/2025', 45, 42, 'active'),
        ('Terminale C', 'Terminale', 'grammar', 'french', '2024/2025', 40, 38, 'active')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Inserted sample class data';
    ELSE
        RAISE NOTICE 'Classes table already has % records', class_count;
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE 'Class-teacher relationship fix completed successfully!';
    RAISE NOTICE 'You can now test the relationship with: SELECT * FROM test_class_teacher_relationship();';
END $$;
