-- =====================================================
-- UPDATE ALL USERS TO PISON ACADEMY
-- =====================================================
-- This script updates all existing users to use Pison Academy
-- email addresses and resets their passwords to new secure ones
-- 
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Generated on: 2025-09-13T04:03:09.073Z
-- =====================================================

-- First, let's see what users currently exist
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password
FROM users 
ORDER BY role, email;

-- =====================================================
-- UPDATE ADMIN USERS
-- =====================================================

-- Update admin user email and reset password
UPDATE users 
SET 
    email = 'admin@pisonacademy.cm',
    password_hash = '$2b$12$/V.TX24Y8xPxuUssQCuBxuWoGjYW/8aEl0q2WBhSjivH.1R/My2me',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE email LIKE '%admin%' OR role = 'admin';

-- =====================================================
-- UPDATE TEACHER USERS
-- =====================================================

-- Update teacher users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%teacher%' THEN 'teacher@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '$2b$12$tFp8Ku7Kc/3wfU0pq2DYeOHdJqRJhXoM3UGm9uGgeWMa4KAE8F.Su',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'teacher';

-- =====================================================
-- UPDATE STUDENT USERS
-- =====================================================

-- Update student users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%student%' THEN 'student@pisonacademy.cm'
        WHEN email LIKE '%@student.gbhs%' THEN REPLACE(email, '@student.gbhs.cm', '@student.pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@student.pisonacademy.cm')
    END,
    password_hash = '$2b$12$9Gus8CSeFTwdrK7wtTezNuNcB8.amZvpztiK6z7IZQdpVLuSUjJ5S',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'student';

-- =====================================================
-- UPDATE PARENT USERS
-- =====================================================

-- Update parent users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%parent%' THEN 'parent@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '$2b$12$9AzK/5YriM6/4dXJjzltEeUNbMKSxpXNGhC9XTyOmGQqUM5GGa5D6',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'parent';

-- =====================================================
-- UPDATE BURSAR USERS
-- =====================================================

-- Update bursar users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%bursar%' THEN 'bursar@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '$2b$12$N8UhOP65.91eosh4aeYHBekknEwzKn8kMLbDZ2bsWmBsifIiSAME6',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'bursar';

-- =====================================================
-- CREATE DEFAULT USERS IF THEY DON'T EXIST
-- =====================================================

-- Insert admin user if not exists
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
    '$2b$12$/V.TX24Y8xPxuUssQCuBxuWoGjYW/8aEl0q2WBhSjivH.1R/My2me',
    'System Administrator',
    'admin',
    'active',
    ARRAY['all'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert teacher user if not exists
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
    '$2b$12$tFp8Ku7Kc/3wfU0pq2DYeOHdJqRJhXoM3UGm9uGgeWMa4KAE8F.Su',
    'Paul Biya Mbeki',
    'teacher',
    'active',
    ARRAY['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert student user if not exists
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
    '$2b$12$9Gus8CSeFTwdrK7wtTezNuNcB8.amZvpztiK6z7IZQdpVLuSUjJ5S',
    'Amina Fru',
    'student',
    'active',
    ARRAY['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert parent user if not exists
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
    '$2b$12$9AzK/5YriM6/4dXJjzltEeUNbMKSxpXNGhC9XTyOmGQqUM5GGa5D6',
    'John Fru',
    'parent',
    'active',
    ARRAY['view_child_progress', 'communicate_teachers', 'view_financial_records'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert bursar user if not exists
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
    '$2b$12$N8UhOP65.91eosh4aeYHBekknEwzKn8kMLbDZ2bsWmBsifIiSAME6',
    'Grace Tabi',
    'bursar',
    'active',
    ARRAY['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify all users were updated successfully
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password,
    password_last_changed,
    updated_at
FROM users 
ORDER BY role, email;

-- =====================================================
-- SUMMARY
-- =====================================================

-- Count users by role
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN has_default_password = true THEN 1 END) as default_password_count
FROM users 
GROUP BY role
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
-- 1. This script updates all existing users to use Pison Academy emails
-- 2. All passwords are reset to default values with has_default_password = true
-- 3. Users should change their passwords on first login
-- 4. Run this script in your Supabase SQL Editor
-- 5. After running, users can log in with their new Pison Academy emails
-- 
-- =====================================================