-- Financial Database Diagnostic Script
-- Run this script to identify potential issues with financial tables

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('payments', 'student_fee_assignments', 'fee_structures', 'payment_methods', 'students');

-- Check table structures
\echo '=== PAYMENTS TABLE STRUCTURE ==='
\d payments;

\echo '=== STUDENT_FEE_ASSIGNMENTS TABLE STRUCTURE ==='
\d student_fee_assignments;

\echo '=== FEE_STRUCTURES TABLE STRUCTURE ==='
\d fee_structures;

\echo '=== PAYMENT_METHODS TABLE STRUCTURE ==='
\d payment_methods;

\echo '=== STUDENTS TABLE STRUCTURE ==='
\d students;

-- Check for data in tables
\echo '=== DATA COUNTS ==='
SELECT 'payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'student_fee_assignments' as table_name, COUNT(*) as record_count FROM student_fee_assignments
UNION ALL
SELECT 'fee_structures' as table_name, COUNT(*) as record_count FROM fee_structures
UNION ALL
SELECT 'payment_methods' as table_name, COUNT(*) as record_count FROM payment_methods
UNION ALL
SELECT 'students' as table_name, COUNT(*) as record_count FROM students;

-- Check for foreign key relationships
\echo '=== FOREIGN KEY RELATIONSHIPS ==='
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('payments', 'student_fee_assignments');

-- Test basic queries that the application uses
\echo '=== TESTING BASIC QUERIES ==='

\echo 'Testing payments query:'
SELECT 
    p.id,
    p.student_id,
    p.amount,
    p.payment_date,
    s.first_name,
    s.last_name,
    fs.name as fee_structure_name,
    pm.name as payment_method_name
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN fee_structures fs ON p.fee_structure_id = fs.id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
LIMIT 5;

\echo 'Testing student_fee_assignments query:'
SELECT 
    sfa.id,
    sfa.student_id,
    sfa.total_amount,
    sfa.paid_amount,
    sfa.balance_amount,
    s.first_name,
    s.last_name,
    fs.name as fee_structure_name
FROM student_fee_assignments sfa
LEFT JOIN students s ON sfa.student_id = s.id
LEFT JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
LIMIT 5;

-- Check for any constraint violations
\echo '=== CHECKING FOR CONSTRAINT VIOLATIONS ==='

-- Check for orphaned payments (student_id not in students table)
SELECT 'Orphaned payments' as issue, COUNT(*) as count
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned student_fee_assignments (student_id not in students table)
SELECT 'Orphaned student_fee_assignments' as issue, COUNT(*) as count
FROM student_fee_assignments sfa
LEFT JOIN students s ON sfa.student_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned payments (fee_structure_id not in fee_structures table)
SELECT 'Payments with invalid fee_structure_id' as issue, COUNT(*) as count
FROM payments p
LEFT JOIN fee_structures fs ON p.fee_structure_id = fs.id
WHERE fs.id IS NULL AND p.fee_structure_id IS NOT NULL;

-- Check for orphaned student_fee_assignments (fee_structure_id not in fee_structures table)
SELECT 'Student_fee_assignments with invalid fee_structure_id' as issue, COUNT(*) as count
FROM student_fee_assignments sfa
LEFT JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
WHERE fs.id IS NULL AND sfa.fee_structure_id IS NOT NULL;

-- Check for orphaned payments (payment_method_id not in payment_methods table)
SELECT 'Payments with invalid payment_method_id' as issue, COUNT(*) as count
FROM payments p
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE pm.id IS NULL AND p.payment_method_id IS NOT NULL;

-- Check RLS (Row Level Security) policies
\echo '=== ROW LEVEL SECURITY POLICIES ==='
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('payments', 'student_fee_assignments', 'fee_structures', 'payment_methods', 'students');

-- Check user permissions
\echo '=== USER PERMISSIONS ==='
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('payments', 'student_fee_assignments', 'fee_structures', 'payment_methods', 'students')
    AND grantee = current_user;

\echo '=== DIAGNOSTIC COMPLETE ==='
