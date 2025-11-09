-- Core users and profiles schema
-- Requires PostgreSQL (Supabase). Enable required extensions first.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email VARCHAR(255) UNIQUE NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	name VARCHAR(255) NOT NULL,
	role VARCHAR(50) NOT NULL CHECK (role IN ('admin','teacher','student','parent','bursar')),
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
	avatar_url TEXT,
	phone VARCHAR(20),
	address TEXT,
	date_of_birth DATE,
	gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
	permissions TEXT[],
	has_default_password BOOLEAN NOT NULL DEFAULT true,
	password_last_changed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	password_expiry_date TIMESTAMPTZ,
	last_login TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- User profiles table (role-specific info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	role_specific_id VARCHAR(50) UNIQUE,
	subsystem VARCHAR(20) CHECK (subsystem IN ('english','french')),
	branch VARCHAR(20) CHECK (branch IN ('grammar','technical','commercial')),
	class_name VARCHAR(50),
	occupation VARCHAR(100),
	relationship VARCHAR(20) CHECK (relationship IN ('father','mother','guardian','other')),
	emergency_contact_name VARCHAR(255),
	emergency_contact_phone VARCHAR(20),
	emergency_contact_relationship VARCHAR(20),
	blood_group VARCHAR(10),
	allergies TEXT,
	medical_conditions TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User activity logs (audit trail)
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
	action VARCHAR(100) NOT NULL,
	description TEXT,
	ip_address INET,
	user_agent TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
	BEFORE UPDATE ON public.users
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_set_updated_at
	BEFORE UPDATE ON public.user_profiles
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- User details view (joins users and user_profiles for comprehensive user information)
CREATE OR REPLACE VIEW public.user_details AS
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
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id;

