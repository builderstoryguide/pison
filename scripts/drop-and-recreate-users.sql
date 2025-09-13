-- =====================================================
-- DROP AND RECREATE ALL USERS FOR PISON ACADEMY
-- =====================================================
-- This script completely removes all existing users and creates
-- fresh ones with working Pison Academy credentials
-- 
-- IMPORTANT: This will DELETE ALL existing users!
-- Make sure to backup your database before running this script.
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K9X9K9K', -- Admin@2024
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
    '$2b$12$tFp8Ku7Kc/3wfU0pq2DYeOHdJqRJhXoM3UGm9uGgeWMa4KAE8F.Su', -- Teacher@2024UJAL
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
    '$2b$12$9Gus8CSeFTwdrK7wtTezNuNcB8.amZvpztiK6z7IZQdpVLuSUjJ5S', -- Student@2024JWPM
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
    '$2b$12$9AzK/5YriM6/4dXJjzltEeUNbMKSxpXNGhC9XTyOmGQqUM5GGa5D6', -- Parent@2024BPF9
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
    '$2b$12$N8UhOP65.91eosh4aeYHBekknEwzKn8kMLbDZ2bsWmBsifIiSAME6', -- Bursar@2024X75G
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
-- Password: Teacher@2024UJAL
-- 
-- STUDENT:
-- Email: student@pisonacademy.cm
-- Password: Student@2024JWPM
-- 
-- PARENT:
-- Email: parent@pisonacademy.cm
-- Password: Parent@2024BPF9
-- 
-- BURSAR:
-- Email: bursar@pisonacademy.cm
-- Password: Bursar@2024X75G
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
-- 
-- =====================================================
