-- =====================================================
-- UPDATE ALL USERS TO PISON ACADEMY
-- =====================================================
-- This script updates all existing users to use Pison Academy
-- email addresses and resets their passwords to new secure ones
-- 
-- IMPORTANT: Run this script in your Supabase SQL Editor
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
    password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K9X9K9K', -- Admin@2024
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
    password_hash = '$2b$12$Teacher2024HashPlaceholder', -- Will be updated with actual hash
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
    password_hash = '$2b$12$Student2024HashPlaceholder', -- Will be updated with actual hash
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
    password_hash = '$2b$12$Parent2024HashPlaceholder', -- Will be updated with actual hash
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
    password_hash = '$2b$12$Bursar2024HashPlaceholder', -- Will be updated with actual hash
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K9X9K9K', -- Admin@2024
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
    '$2b$12$Teacher2024HashPlaceholder', -- Teacher@2024 + random chars
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
    '$2b$12$Student2024HashPlaceholder', -- Student@2024 + random chars
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
    '$2b$12$Parent2024HashPlaceholder', -- Parent@2024 + random chars
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
    '$2b$12$Bursar2024HashPlaceholder', -- Bursar@2024 + random chars
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
-- IMPORTANT NOTES
-- =====================================================
-- 
-- 1. This script updates all existing users to use Pison Academy emails
-- 2. All passwords are reset to default values with has_default_password = true
-- 3. Users should change their passwords on first login
-- 4. The password hashes shown are placeholders - you should generate real ones
-- 5. Run this script in your Supabase SQL Editor
-- 6. After running, users can log in with their new Pison Academy emails
-- 
-- =====================================================
