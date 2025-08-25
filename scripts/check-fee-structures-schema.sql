-- Check fee_structures table structure
-- Run this to see what columns actually exist

\echo '=== FEE_STRUCTURES TABLE STRUCTURE ==='
\d fee_structures;

\echo '=== FEE_STRUCTURES COLUMNS ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

\echo '=== SAMPLE DATA ==='
SELECT * FROM fee_structures LIMIT 3;
