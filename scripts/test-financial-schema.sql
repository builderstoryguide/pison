-- Test Financial Schema Script
-- This script tests the financial database schema and identifies any issues

-- Check if required tables exist
SELECT 'Checking table existence...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('payment_methods', 'fee_structures', 'payments', 'payment_plans', 'payment_plan_installments', 'fee_categories', 'fee_structure_items') 
        THEN 'Required table'
        ELSE 'Optional table'
    END as table_type,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('payment_methods', 'fee_structures', 'payments', 'payment_plans', 'payment_plan_installments', 'fee_categories', 'fee_structure_items', 'classes', 'students', 'users')
ORDER BY table_name;

-- Check payment_methods table structure
SELECT 'Checking payment_methods table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_methods' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check fee_structures table structure
SELECT 'Checking fee_structures table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payments table structure
SELECT 'Checking payments table structure...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if payment_methods has data
SELECT 'Checking payment_methods data...' as status;

SELECT COUNT(*) as payment_methods_count FROM payment_methods;

-- Check if fee_categories has data
SELECT 'Checking fee_categories data...' as status;

SELECT COUNT(*) as fee_categories_count FROM fee_categories;

-- Check if classes table exists and has data
SELECT 'Checking classes table...' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as classes_table_status;

SELECT COUNT(*) as classes_count FROM classes;

-- Test foreign key relationships
SELECT 'Testing foreign key relationships...' as status;

-- Test fee_structures -> classes relationship
SELECT 
    'fee_structures -> classes' as relationship,
    COUNT(*) as total_fee_structures,
    COUNT(fs.class_id) as with_class_id,
    COUNT(c.id) as valid_class_references
FROM fee_structures fs
LEFT JOIN classes c ON fs.class_id = c.id;

-- Test payments -> payment_methods relationship
SELECT 
    'payments -> payment_methods' as relationship,
    COUNT(*) as total_payments,
    COUNT(p.payment_method_id) as with_payment_method_id,
    COUNT(pm.id) as valid_payment_method_references
FROM payments p
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id;

-- Check for any orphaned records
SELECT 'Checking for orphaned records...' as status;

-- Orphaned fee_structures (no class reference)
SELECT 
    'Orphaned fee_structures' as issue,
    COUNT(*) as count
FROM fee_structures fs
LEFT JOIN classes c ON fs.class_id = c.id
WHERE c.id IS NULL AND fs.class_id IS NOT NULL;

-- Orphaned payments (no payment_method reference)
SELECT 
    'Orphaned payments (no payment_method)' as issue,
    COUNT(*) as count
FROM payments p
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE pm.id IS NULL AND p.payment_method_id IS NOT NULL;

-- Summary
SELECT 'Schema test completed' as status;
