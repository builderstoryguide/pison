-- Shared helpers: roles, RLS placeholders, grants

-- Ensure extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Simple grading helper (optional)
CREATE OR REPLACE FUNCTION public.calculate_grade_letter(p_percentage NUMERIC)
RETURNS VARCHAR AS $$
BEGIN
	IF p_percentage >= 80 THEN RETURN 'A';
	ELSIF p_percentage >= 70 THEN RETURN 'B';
	ELSIF p_percentage >= 60 THEN RETURN 'C';
	ELSIF p_percentage >= 50 THEN RETURN 'D';
	ELSIF p_percentage >= 40 THEN RETURN 'E';
	ELSE RETURN 'F';
	END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Placeholders for RLS (enable in Supabase UI as needed)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT
-- 	USING (user_id = auth.uid());

