-- CREATE ADMIN USER SCRIPT
-- Run this in your Supabase SQL editor

-- Create admin user
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
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions;

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
WHERE u.email = 'admin@pisonacademy.cm'
ON CONFLICT (user_id) DO UPDATE SET
    role_specific_id = EXCLUDED.role_specific_id;

-- LOGIN CREDENTIALS:
-- Email: admin@pisonacademy.cm
-- Password: Admin@2024
-- Role: admin
-- Permissions: all
