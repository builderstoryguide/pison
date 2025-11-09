-- Seed a default admin user (idempotent)
-- Requires: 2025-11-04_001_core_users.sql (pgcrypto enabled)

DO $$
DECLARE
	new_admin_id UUID;
	admin_email CONSTANT TEXT := 'admin@school.com';
	admin_name CONSTANT TEXT := 'System Administrator';
	admin_phone CONSTANT TEXT := '+237 600000000';
	admin_gender CONSTANT TEXT := 'other';
	admin_password_plain CONSTANT TEXT := 'Admin@123';
BEGIN
	-- If an admin with the email already exists, skip creation
	IF EXISTS (
		SELECT 1 FROM public.users WHERE email = admin_email
	) THEN
		RAISE NOTICE 'Admin user % already exists. Skipping creation.', admin_email;
		RETURN;
	END IF;

	-- Create the admin user with a bcrypt hashed password
	INSERT INTO public.users (
		email,
		password_hash,
		name,
		role,
		status,
		phone,
		gender,
		permissions,
		has_default_password,
		password_last_changed
	) VALUES (
		admin_email,
		crypt(admin_password_plain, gen_salt('bf', 10)),
		admin_name,
		'admin',
		'active',
		admin_phone,
		admin_gender,
		ARRAY['all']::TEXT[],
		TRUE,
		NOW()
	) RETURNING id INTO new_admin_id;

	-- Create a minimal profile row for the admin
	INSERT INTO public.user_profiles (
		user_id,
		role_specific_id,
		occupation
	) VALUES (
		new_admin_id,
		'ADM' || TO_CHAR(EXTRACT(YEAR FROM NOW()), 'FM9999') || '001',
		'System Administrator'
	);

	-- Optional: initial activity log
	INSERT INTO public.user_activity_logs (
		user_id,
		action,
		description
	) VALUES (
		new_admin_id,
		'bootstrap',
		'Default admin user created by seed script'
	);

	RAISE NOTICE 'Admin user % created with id %', admin_email, new_admin_id;
END $$;

-- Summary
SELECT 'Admin users count: ' || COUNT(*) AS summary
FROM public.users WHERE role = 'admin';


