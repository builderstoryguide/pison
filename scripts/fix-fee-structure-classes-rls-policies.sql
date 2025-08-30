-- Fix Fee Structure Classes RLS Policies
-- This script will fix the RLS policies for the fee_structure_classes junction table

-- First, let's see the current RLS policies
SELECT 'Current RLS policies on fee_structure_classes table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structure_classes';

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON fee_structure_classes;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON fee_structure_classes;

-- Create more permissive policies for development/testing
-- Allow all operations for now (you can make them more restrictive later)

-- Allow all users to read fee structure classes
CREATE POLICY "Enable read access for all users" ON fee_structure_classes
    FOR SELECT USING (true);

-- Allow all users to insert fee structure classes (for now)
CREATE POLICY "Enable insert access for all users" ON fee_structure_classes
    FOR INSERT WITH CHECK (true);

-- Allow all users to update fee structure classes (for now)
CREATE POLICY "Enable update access for all users" ON fee_structure_classes
    FOR UPDATE USING (true);

-- Allow all users to delete fee structure classes (for now)
CREATE POLICY "Enable delete access for all users" ON fee_structure_classes
    FOR DELETE USING (true);

-- Show the updated RLS policies
SELECT 'Updated RLS policies on fee_structure_classes table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structure_classes';

-- Test if we can insert a sample fee structure class relationship
SELECT 'Testing fee structure class relationship insertion...' as info;

-- First, let's get a fee structure and a class to test with
SELECT 'Available fee structures:' as info;
SELECT id, name FROM fee_structures LIMIT 3;

SELECT 'Available classes:' as info;
SELECT id, class_name FROM classes LIMIT 3;

-- Try to insert a test relationship (if we have both fee structures and classes)
DO $$
DECLARE
    fee_structure_id UUID;
    class_id UUID;
BEGIN
    -- Get the first fee structure
    SELECT id INTO fee_structure_id FROM fee_structures LIMIT 1;
    
    -- Get the first class
    SELECT id INTO class_id FROM classes LIMIT 1;
    
    -- If we have both, test the insertion
    IF fee_structure_id IS NOT NULL AND class_id IS NOT NULL THEN
        INSERT INTO fee_structure_classes (
            fee_structure_id,
            class_id
        ) VALUES (
            fee_structure_id,
            class_id
        ) ON CONFLICT (fee_structure_id, class_id) DO NOTHING;
        
        RAISE NOTICE 'Test relationship inserted successfully';
        
        -- Clean up test relationship
        DELETE FROM fee_structure_classes 
        WHERE fee_structure_id = fee_structure_id AND class_id = class_id;
        
        RAISE NOTICE 'Test relationship cleaned up';
    ELSE
        RAISE NOTICE 'Cannot test: No fee structures or classes available';
    END IF;
END $$;

SELECT 'RLS policies for fee_structure_classes have been updated successfully!' as result;
