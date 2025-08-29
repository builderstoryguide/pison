-- Quick Users Database Setup for School Management System
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'bursar')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    permissions TEXT[],
    has_default_password BOOLEAN DEFAULT true,
    password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_expiry_date TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_specific_id VARCHAR(50) UNIQUE,
    subsystem VARCHAR(20) CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) CHECK (branch IN ('grammar', 'technical', 'commercial')),
    class_name VARCHAR(50),
    occupation VARCHAR(100),
    relationship VARCHAR(20) CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(20),
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_specific_id ON user_profiles(role_specific_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp);

-- Create function to generate role-specific IDs
CREATE OR REPLACE FUNCTION generate_role_specific_id(role_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    new_id VARCHAR;
    year_part VARCHAR;
    random_part VARCHAR;
    prefix VARCHAR;
    counter INTEGER := 0;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    random_part := LPAD(FLOOR(RANDOM() * 1000)::VARCHAR, 3, '0');
    
    CASE role_type
        WHEN 'student' THEN prefix := 'STU';
        WHEN 'teacher' THEN prefix := 'TCH';
        WHEN 'parent' THEN prefix := 'PAR';
        WHEN 'bursar' THEN prefix := 'BUR';
        ELSE prefix := 'USR';
    END CASE;
    
    new_id := prefix || year_part || random_part;
    
    -- Check if ID already exists and generate a new one if needed
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE role_specific_id = new_id) LOOP
        random_part := LPAD(FLOOR(RANDOM() * 1000)::VARCHAR, 3, '0');
        new_id := prefix || year_part || random_part;
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique ID after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action VARCHAR,
    p_details TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user (password should be changed on first login)
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_by
) VALUES (
    'admin@gbhs-yaounde.cm',
    '$2b$10$default.hash.placeholder', -- This should be replaced with actual hash
    'System Administrator',
    'admin',
    'active',
    ARRAY['all'],
    true,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Create a view for user details with profile information
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.avatar_url,
    u.phone,
    u.address,
    u.date_of_birth,
    u.gender,
    u.permissions,
    u.has_default_password,
    u.password_last_changed,
    u.password_expiry_date,
    u.last_login,
    u.created_at,
    u.updated_at,
    u.created_by,
    up.role_specific_id,
    up.subsystem,
    up.branch,
    up.class_name,
    up.occupation,
    up.relationship,
    up.emergency_contact_name,
    up.emergency_contact_phone,
    up.emergency_contact_relationship,
    up.blood_group,
    up.allergies,
    up.medical_conditions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
-- GRANT SELECT, INSERT ON user_activity_logs TO authenticated;
-- GRANT SELECT ON user_details TO authenticated;
