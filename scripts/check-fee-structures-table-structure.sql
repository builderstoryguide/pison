-- Check Fee Structures Table Structure
-- This script will show us exactly what columns exist in the fee_structures table

-- Show current table structure
SELECT 'Current fee_structures table structure:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Show table constraints
SELECT 'Table constraints:' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'fee_structures';

-- Show sample data (if any exists)
SELECT 'Sample data (first 5 rows):' as info;
SELECT * FROM fee_structures LIMIT 5;

-- Count total records
SELECT 'Total records:' as info;
SELECT COUNT(*) as total_records FROM fee_structures;
