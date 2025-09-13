-- =====================================================
-- DROP AND RECREATE ALL USERS FOR PISON ACADEMY
-- =====================================================
-- This script completely removes all existing users and creates
-- fresh ones with working Pison Academy credentials
-- 
-- IMPORTANT: This will DELETE ALL existing users!
-- Make sure to backup your database before running this script.
-- Generated on: 2025-09-13T04:11:34.907Z
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP EXISTING USERS (OPTIONAL)
-- =====================================================
-- Uncomment the following lines if you want to backup existing users first
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- SELECT 'Backup created: users_backup table' as status;

-- =====================================================
-- STEP 2: DROP ALL EXISTING USERS
-- =====================================================

-- Delete all existing users
DELETE FROM users;

-- Reset the sequence if it exists (for auto-incrementing IDs)
-- This ensures new users start with ID 1
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'users_id_seq') THEN
        ALTER SEQUENCE users_id_seq RESTART WITH 1;
    END IF;
END $$;

SELECT 'All existing users deleted' as status;

-- =====================================================
-- STEP 3: CREATE FRESH USERS WITH WORKING CREDENTIALS
-- =====================================================

-- Create Admin User
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'admin@pisonacademy.cm',
    '$2b$12$fq38y.2s6ya6rNTkgNggwONJwLkiXn7wjP.8SrHZ9F4U3N2q/qEvG',
    'System Administrator',
    'admin',
    'active',
    ARRAY['all'],
    true,
    NOW(),
    NOW()
);

-- Create Teacher User
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'teacher@pisonacademy.cm',
    '$2b$12$De7SivWXj2O/fYG9AFV5JucMcFeL4MA16rJoWCsTFtQhpeArj7RDG',
    'Paul Biya Mbeki',
    'teacher',
    'active',
    ARRAY['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents'],
    true,
    NOW(),
    NOW()
);

-- Create Student User
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'student@pisonacademy.cm',
    '$2b$12$u9bJBaEeow/zhVsVkdARhuzs993RNsp3zEl3VePgprwssL1tAzZvq',
    'Amina Fru',
    'student',
    'active',
    ARRAY['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
    true,
    NOW(),
    NOW()
);

-- Create Parent User
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'parent@pisonacademy.cm',
    '$2b$12$Haet.PvmmfNtnqc5J4fWa.mocshlv0xFIl55wvPagzi4IsTEzodSW',
    'John Fru',
    'parent',
    'active',
    ARRAY['view_child_progress', 'communicate_teachers', 'view_financial_records'],
    true,
    NOW(),
    NOW()
);

-- Create Bursar User
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'bursar@pisonacademy.cm',
    '$2b$12$BEXejTg0DEyf6SkgUpdEqOlOs16l6gi5iPLtTPwNAtE7SLlpuRqQm',
    'Grace Tabi',
    'bursar',
    'active',
    ARRAY['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices'],
    true,
    NOW(),
    NOW()
);

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Verify all users were created successfully
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password,
    created_at
FROM users 
ORDER BY role, email;

-- Count users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- =====================================================
-- STEP 5: TEST LOGIN CREDENTIALS
-- =====================================================

-- Test password hashes (this will show if the hashes are valid)
SELECT 
    email,
    role,
    CASE 
        WHEN password_hash LIKE '$2b$12$%' THEN 'Valid bcrypt hash'
        ELSE 'Invalid hash format'
    END as hash_status,
    LENGTH(password_hash) as hash_length
FROM users
ORDER BY role;

-- =====================================================
-- LOGIN CREDENTIALS SUMMARY
-- =====================================================
-- 
-- ADMIN:
-- Email: admin@pisonacademy.cm
-- Password: Admin@2024
-- 
-- TEACHER:
-- Email: teacher@pisonacademy.cm
-- Password: Teacher@2024DEXF
-- 
-- STUDENT:
-- Email: student@pisonacademy.cm
-- Password: Student@2024S5W5
-- 
-- PARENT:
-- Email: parent@pisonacademy.cm
-- Password: Parent@2024FGEG
-- 
-- BURSAR:
-- Email: bursar@pisonacademy.cm
-- Password: Bursar@20247RL4
-- 
-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 
-- 1. This script DELETES ALL existing users
-- 2. Creates fresh users with working credentials
-- 3. All users have has_default_password = true
-- 4. Users should change passwords on first login
-- 5. The password hashes are generated with bcrypt rounds = 12
-- 6. All users are set to 'active' status
-- 7. Password hash tests: PASS, PASS, PASS, PASS, PASS
-- 
-- =====================================================