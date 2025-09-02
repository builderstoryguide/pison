-- =====================================================
-- COMPLETE ADMIN USERS CREATION SCRIPT
-- =====================================================
-- This script creates multiple admin users with full system access
-- Run this in your Supabase SQL editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRIMARY ADMIN USER
-- =====================================================

-- Create the main system administrator
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    status,
    avatar_url,
    phone,
    address,
    date_of_birth,
    gender,
    permissions,
    has_default_password,
    password_last_changed,
    password_expiry_date,
    created_at,
    updated_at
) VALUES (
    'admin@pisonacademy.cm',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6O',
    'Dr. Marie Ngozi',
    'admin',
    'active',
    'initials:MN',
    '+237 677 123 456',
    'Pison Academy of Excellence, Yaounde, Cameroon',
    '1980-01-01',
    'female',
    ARRAY['all'],
    true,
    NOW(),
    (NOW() + INTERVAL '30 days'),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = EXCLUDED.password_last_changed,
    password_expiry_date = EXCLUDED.password_expiry_date,
    updated_at = NOW();

-- Create profile for primary admin
INSERT INTO user_profiles (
    user_id,
    role_specific_id,
    subsystem,
    branch,
    occupation,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'ADM2024001',
    'english',
    'grammar',
    'Principal & System Administrator',
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'admin@pisonacademy.cm'
ON CONFLICT (user_id) DO UPDATE SET
    role_specific_id = EXCLUDED.role_specific_id,
    subsystem = EXCLUDED.subsystem,
    branch = EXCLUDED.branch,
    occupation = EXCLUDED.occupation,
    updated_at = NOW();

-- =====================================================
-- FINANCIAL ADMIN (BURSAR)
-- =====================================================

-- Create the financial administrator
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    status,
    avatar_url,
    phone,
    address,
    date_of_birth,
    gender,
    permissions,
    has_default_password,
    password_last_changed,
    password_expiry_date,
    created_at,
    updated_at
) VALUES (
    'bursar@pisonacademy.cm',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6O',
    'Grace Tabi',
    'admin',
    'active',
    'initials:GT',
    '+237 677 234 567',
    'Pison Academy of Excellence, Yaounde, Cameroon',
    '1985-01-01',
    'female',
    ARRAY['all'],
    true,
    NOW(),
    (NOW() + INTERVAL '30 days'),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = EXCLUDED.password_last_changed,
    password_expiry_date = EXCLUDED.password_expiry_date,
    updated_at = NOW();

-- Create profile for bursar
INSERT INTO user_profiles (
    user_id,
    role_specific_id,
    subsystem,
    branch,
    occupation,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'BUR2024001',
    'english',
    'grammar',
    'Financial Administrator',
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'bursar@pisonacademy.cm'
ON CONFLICT (user_id) DO UPDATE SET
    role_specific_id = EXCLUDED.role_specific_id,
    subsystem = EXCLUDED.subsystem,
    branch = EXCLUDED.branch,
    occupation = EXCLUDED.occupation,
    updated_at = NOW();

-- =====================================================
-- IT ADMINISTRATOR
-- =====================================================

-- Create the IT administrator
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    status,
    avatar_url,
    phone,
    address,
    date_of_birth,
    gender,
    permissions,
    has_default_password,
    password_last_changed,
    password_expiry_date,
    created_at,
    updated_at
) VALUES (
    'it@pisonacademy.cm',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6O',
    'John Tech Admin',
    'admin',
    'active',
    'initials:JT',
    '+237 677 345 678',
    'Pison Academy of Excellence, Yaounde, Cameroon',
    '1990-01-01',
    'male',
    ARRAY['all'],
    true,
    NOW(),
    (NOW() + INTERVAL '30 days'),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = EXCLUDED.password_last_changed,
    password_expiry_date = EXCLUDED.password_expiry_date,
    updated_at = NOW();

-- Create profile for IT admin
INSERT INTO user_profiles (
    user_id,
    role_specific_id,
    subsystem,
    branch,
    occupation,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'IT2024001',
    'english',
    'grammar',
    'IT Administrator',
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'it@pisonacademy.cm'
ON CONFLICT (user_id) DO UPDATE SET
    role_specific_id = EXCLUDED.role_specific_id,
    subsystem = EXCLUDED.subsystem,
    branch = EXCLUDED.branch,
    occupation = EXCLUDED.occupation,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify all admin users were created successfully
SELECT 
    u.email,
    u.name,
    u.role,
    u.status,
    u.permissions,
    up.role_specific_id,
    up.subsystem,
    up.branch,
    up.occupation,
    u.has_default_password,
    u.password_expiry_date
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.role = 'admin'
ORDER BY u.email;

-- =====================================================
-- LOGIN CREDENTIALS SUMMARY
-- =====================================================
-- 
-- PRIMARY ADMIN:
-- Email: admin@pisonacademy.cm
-- Password: Admin@2024
-- Role: admin
-- Permissions: all
-- 
-- FINANCIAL ADMIN:
-- Email: bursar@pisonacademy.cm  
-- Password: Admin@2024
-- Role: admin
-- Permissions: all
-- 
-- IT ADMIN:
-- Email: it@pisonacademy.cm
-- Password: Admin@2024
-- Role: admin
-- Permissions: all
-- 
-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. All users have the same password for initial setup
-- 2. Password expires in 30 days for security
-- 3. Users should change password on first login
-- 4. All users have 'all' permissions for full system access
-- 5. Run this script in your Supabase SQL editor
-- 6. After running, you can log in with any of these accounts
-- =====================================================
