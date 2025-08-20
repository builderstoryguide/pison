-- Verify Enrollment Schema
-- Run this script to check if all required columns exist for student enrollment

-- Check students table structure
SELECT 'STUDENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('first_name', 'last_name', 'date_of_birth', 'place_of_birth', 'email', 'address', 'city', 'region', 'subsystem', 'branch', 'class') THEN 'REQUIRED'
        ELSE 'OPTIONAL'
    END as requirement
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check for missing required columns
SELECT 'MISSING REQUIRED COLUMNS IN STUDENTS TABLE:' as info;
SELECT 'Missing column: ' || column_name as missing_column
FROM (
    VALUES 
        ('first_name'), ('last_name'), ('middle_name'), ('date_of_birth'), 
        ('gender'), ('place_of_birth'), ('nationality'), ('religion'), 
        ('email'), ('phone'), ('address'), ('city'), ('region'), 
        ('subsystem'), ('branch'), ('class'), ('previous_school'), 
        ('previous_class'), ('is_new_student'), ('total_fees'), ('paid_fees'), 
        ('fees_status'), ('enrollment_status'), ('academic_year'), 
        ('status'), ('enrollment_date')
) AS required_columns(column_name)
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = required_columns.column_name
);

-- Check parents table structure
SELECT 'PARENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'parents' 
ORDER BY ordinal_position;

-- Check emergency_contacts table structure
SELECT 'EMERGENCY_CONTACTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'emergency_contacts' 
ORDER BY ordinal_position;

-- Check medical_info table structure
SELECT 'MEDICAL_INFO TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_info' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 'STUDENTS TABLE CONSTRAINTS:' as info;
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE 'students_%';

-- Summary
SELECT 'ENROLLMENT SCHEMA VERIFICATION SUMMARY:' as info;
SELECT 
    'Students table columns: ' || COUNT(*) as summary
FROM information_schema.columns 
WHERE table_name = 'students'
UNION ALL
SELECT 
    'Parents table columns: ' || COUNT(*) as summary
FROM information_schema.columns 
WHERE table_name = 'parents'
UNION ALL
SELECT 
    'Emergency contacts table columns: ' || COUNT(*) as summary
FROM information_schema.columns 
WHERE table_name = 'emergency_contacts'
UNION ALL
SELECT 
    'Medical info table columns: ' || COUNT(*) as summary
FROM information_schema.columns 
WHERE table_name = 'medical_info';
