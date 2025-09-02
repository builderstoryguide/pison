-- CREATE ADMIN USER SCRIPT (FIXED VERSION)
-- Run this in your Supabase SQL editor
-- This version removes ON CONFLICT clauses that may cause errors

-- First, let's check if the admin user already exists and delete it if it does
DELETE FROM user_profiles WHERE user_id IN (
    SELECT id FROM users WHERE email = 'admin@pisonacademy.cm'
);

DELETE FROM users WHERE email = 'admin@pisonacademy.cm';

-- Now create the admin user
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
    password_expiry_date
) VALUES (
    'admin@pisonacademy.cm',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6O',
    'System Administrator',
    'admin',
    'active',
    'initials:SA',
    '+237 677 123 456',
    'Pison Academy of Excellence, Yaounde, Cameroon',
    '1980-01-01',
    'male',
    ARRAY['all'],
    true,
    NOW(),
    (NOW() + INTERVAL '30 days')
);

-- Create admin profile
INSERT INTO user_profiles (
    user_id,
    role_specific_id,
    subsystem,
    branch
) 
SELECT 
    u.id,
    'ADM2024001',
    'english',
    'grammar'
FROM users u 
WHERE u.email = 'admin@pisonacademy.cm';

-- Verify the user was created
SELECT 
    u.email,
    u.name,
    u.role,
    u.status,
    u.permissions,
    up.role_specific_id
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'admin@pisonacademy.cm';

-- LOGIN CREDENTIALS:
-- Email: admin@pisonacademy.cm
-- Password: Admin@2024
-- Role: admin
-- Permissions: all
