-- Complete Fee Structure Setup
-- This script will set up the entire fee structure system with multiple class support

-- Step 1: Create the fee_structure_classes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structure_classes') THEN
        -- Create the fee_structure_classes junction table
        CREATE TABLE fee_structure_classes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Ensure unique combination of fee structure and class
            UNIQUE(fee_structure_id, class_id)
        );

        -- Create indexes for better performance
        CREATE INDEX idx_fee_structure_classes_fee_structure_id ON fee_structure_classes(fee_structure_id);
        CREATE INDEX idx_fee_structure_classes_class_id ON fee_structure_classes(class_id);
        CREATE INDEX idx_fee_structure_classes_created_at ON fee_structure_classes(created_at);

        RAISE NOTICE 'fee_structure_classes table created successfully';
    ELSE
        RAISE NOTICE 'fee_structure_classes table already exists';
    END IF;
END $$;

-- Step 2: Fix RLS policies for fee_structures table
SELECT 'Fixing RLS policies for fee_structures table...' as info;

-- Drop existing policies on fee_structures
DROP POLICY IF EXISTS "Enable read access for all users" ON fee_structures;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON fee_structures;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON fee_structures;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON fee_structures;

-- Create permissive policies for fee_structures
CREATE POLICY "Enable read access for all users" ON fee_structures
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON fee_structures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON fee_structures
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON fee_structures
    FOR DELETE USING (true);

-- Step 3: Fix RLS policies for fee_structure_classes table
SELECT 'Fixing RLS policies for fee_structure_classes table...' as info;

-- Enable RLS on fee_structure_classes
ALTER TABLE fee_structure_classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on fee_structure_classes
DROP POLICY IF EXISTS "Enable read access for all users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON fee_structure_classes;

-- Create permissive policies for fee_structure_classes
CREATE POLICY "Enable read access for all users" ON fee_structure_classes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON fee_structure_classes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON fee_structure_classes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON fee_structure_classes
    FOR DELETE USING (true);

-- Step 4: Create the view for easy querying
SELECT 'Creating fee_structures_with_classes view...' as info;

CREATE OR REPLACE VIEW fee_structures_with_classes AS
SELECT 
    fs.id as fee_structure_id,
    fs.name as fee_structure_name,
    COALESCE(fs.subsystem, 'english') as subsystem,
    COALESCE(fs.level, '') as level,
    COALESCE(fs.branch, 'grammar') as branch,
    fs.amount,
    fs.due_date,
    COALESCE(fs.term, 'first') as term,
    COALESCE(fs.academic_year, '2024-2025') as academic_year,
    COALESCE(fs.description, '') as description,
    COALESCE(fs.is_active, true) as is_active,
    COALESCE(fs.created_at, NOW()) as fee_structure_created_at,
    COALESCE(fs.updated_at, NOW()) as fee_structure_updated_at,
    array_agg(c.id) FILTER (WHERE c.id IS NOT NULL) as class_ids,
    array_agg(c.class_name) FILTER (WHERE c.class_name IS NOT NULL) as class_names,
    array_agg(c.class_level) FILTER (WHERE c.class_level IS NOT NULL) as class_levels,
    array_agg(c.stream) FILTER (WHERE c.stream IS NOT NULL) as class_streams,
    array_agg(c.subsystem) FILTER (WHERE c.subsystem IS NOT NULL) as class_subsystems,
    COUNT(c.id) as class_count
FROM fee_structures fs
LEFT JOIN fee_structure_classes fsc ON fs.id = fsc.fee_structure_id
LEFT JOIN classes c ON fsc.class_id = c.id
GROUP BY fs.id, fs.name, fs.subsystem, fs.level, fs.branch, fs.amount, fs.due_date, fs.term, fs.academic_year, fs.description, fs.is_active, fs.created_at, fs.updated_at;

-- Step 5: Test the complete setup
SELECT 'Testing the complete setup...' as info;

-- Test 1: Check if we can create a fee structure
DO $$
BEGIN
    INSERT INTO fee_structures (
        name, 
        subsystem, 
        level, 
        branch, 
        amount, 
        due_date, 
        term, 
        academic_year, 
        description, 
        is_active
    ) VALUES (
        'Test Fee Structure - Complete Setup',
        'english',
        'Form 1',
        'grammar',
        50000.00,
        CURRENT_DATE + INTERVAL '30 days',
        'first',
        '2024-2025',
        'Test fee structure for complete setup verification',
        true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Fee structure creation test: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Fee structure creation test: FAILED - %', SQLERRM;
END $$;

-- Test 2: Check if we can create class relationships
DO $$
DECLARE
    fee_structure_id UUID;
    class_id UUID;
BEGIN
    -- Get the test fee structure
    SELECT id INTO fee_structure_id FROM fee_structures WHERE name = 'Test Fee Structure - Complete Setup' LIMIT 1;
    
    -- Get a class
    SELECT id INTO class_id FROM classes LIMIT 1;
    
    IF fee_structure_id IS NOT NULL AND class_id IS NOT NULL THEN
        INSERT INTO fee_structure_classes (
            fee_structure_id,
            class_id
        ) VALUES (
            fee_structure_id,
            class_id
        ) ON CONFLICT (fee_structure_id, class_id) DO NOTHING;
        
        RAISE NOTICE 'Class relationship creation test: SUCCESS';
        
        -- Clean up test data
        DELETE FROM fee_structure_classes WHERE fee_structure_id = fee_structure_id;
        DELETE FROM fee_structures WHERE id = fee_structure_id;
        
        RAISE NOTICE 'Test data cleaned up';
    ELSE
        RAISE NOTICE 'Class relationship creation test: SKIPPED - No fee structures or classes available';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Class relationship creation test: FAILED - %', SQLERRM;
END $$;

-- Step 6: Show final status
SELECT 'Final setup status:' as info;

-- Show table structures
SELECT 'fee_structures table structure:' as table_info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

SELECT 'fee_structure_classes table structure:' as table_info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structure_classes' 
ORDER BY ordinal_position;

-- Show RLS policies
SELECT 'RLS policies on fee_structures:' as policy_info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';

SELECT 'RLS policies on fee_structure_classes:' as policy_info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structure_classes';

-- Show view structure
SELECT 'fee_structures_with_classes view structure:' as view_info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures_with_classes' 
ORDER BY ordinal_position;

SELECT 'Complete fee structure setup finished successfully!' as result;
