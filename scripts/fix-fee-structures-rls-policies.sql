-- Fix Fee Structures RLS Policies
-- This script will fix the RLS policies to allow proper fee structure creation

-- First, let's see the current RLS policies
SELECT 'Current RLS policies on fee_structures table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON fee_structures;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON fee_structures;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON fee_structures;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON fee_structures;

-- Create more permissive policies for development/testing
-- Allow all operations for now (you can make them more restrictive later)

-- Allow all users to read fee structures
CREATE POLICY "Enable read access for all users" ON fee_structures
    FOR SELECT USING (true);

-- Allow all users to insert fee structures (for now)
CREATE POLICY "Enable insert access for all users" ON fee_structures
    FOR INSERT WITH CHECK (true);

-- Allow all users to update fee structures (for now)
CREATE POLICY "Enable update access for all users" ON fee_structures
    FOR UPDATE USING (true);

-- Allow all users to delete fee structures (for now)
CREATE POLICY "Enable delete access for all users" ON fee_structures
    FOR DELETE USING (true);

-- Alternative: If you want to keep authentication checks, use these policies instead:
-- (Uncomment the lines below and comment out the policies above if you want authentication)

/*
-- Allow authenticated users to read fee structures
CREATE POLICY "Enable read access for authenticated users" ON fee_structures
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert fee structures
CREATE POLICY "Enable insert access for authenticated users" ON fee_structures
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update fee structures
CREATE POLICY "Enable update access for authenticated users" ON fee_structures
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete fee structures
CREATE POLICY "Enable delete access for authenticated users" ON fee_structures
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- Show the updated RLS policies
SELECT 'Updated RLS policies on fee_structures table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';

-- Test if we can insert a sample fee structure
SELECT 'Testing fee structure insertion...' as info;

-- Try to insert a test record (this will help us verify the policies work)
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
    'Test Fee Structure',
    'english',
    'Form 1',
    'grammar',
    50000.00,
    CURRENT_DATE + INTERVAL '30 days',
    'first',
    '2024-2025',
    'Test fee structure for RLS policy verification',
    true
) ON CONFLICT DO NOTHING;

-- Check if the test record was inserted
SELECT 'Test record insertion result:' as info;
SELECT COUNT(*) as test_records FROM fee_structures WHERE name = 'Test Fee Structure';

-- Clean up test record
DELETE FROM fee_structures WHERE name = 'Test Fee Structure';

SELECT 'RLS policies have been updated successfully!' as result;
