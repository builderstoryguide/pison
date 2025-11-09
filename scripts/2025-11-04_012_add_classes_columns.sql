-- Add missing columns to classes table for class management
-- This migration adds academic_year, capacity, status, and renames columns to match expected schema

-- 0) Drop the view first to avoid type conflicts
DROP VIEW IF EXISTS public.v_classes;

-- 1) Add academic_year column if missing
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
EXCEPTION WHEN others THEN NULL; END $$;

-- 2) Add capacity column if missing
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
EXCEPTION WHEN others THEN NULL; END $$;

-- 3) Add status column if missing
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
EXCEPTION WHEN others THEN NULL; END $$;

-- 4) Add class_name column if missing (keeping name as alias)
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_name VARCHAR(100);
EXCEPTION WHEN others THEN NULL; END $$;

-- 5) Copy data from name to class_name if class_name is NULL
DO $$ BEGIN
  UPDATE public.classes SET class_name = name WHERE class_name IS NULL AND name IS NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 6) Add class_level column if missing (keeping level as alias)
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_level VARCHAR(50);
EXCEPTION WHEN others THEN NULL; END $$;

-- 7) Copy data from level to class_level if class_level is NULL
DO $$ BEGIN
  UPDATE public.classes SET class_level = level WHERE class_level IS NULL AND level IS NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 8) Add stream column if missing (keeping section as alias)
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS stream VARCHAR(50);
EXCEPTION WHEN others THEN NULL; END $$;

-- 9) Copy data from section to stream if stream is NULL
DO $$ BEGIN
  UPDATE public.classes SET stream = section WHERE stream IS NULL AND section IS NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 10) Add current_enrollment column if missing (keeping student_count as alias)
DO $$ BEGIN
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS current_enrollment INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

-- 11) Copy data from student_count to current_enrollment if current_enrollment is NULL or 0
DO $$ BEGIN
  UPDATE public.classes SET current_enrollment = student_count WHERE (current_enrollment IS NULL OR current_enrollment = 0) AND student_count IS NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 12) Recreate the view to use the actual columns instead of NULL
CREATE VIEW public.v_classes AS
SELECT
  c.id,
  COALESCE(c.class_name, c.name, '') AS class_name,
  COALESCE(c.class_level, c.level, '') AS class_level,
  c.subsystem,
  COALESCE(c.stream, c.section, '') AS stream,
  COALESCE(c.capacity, 40) AS capacity,
  COALESCE(c.current_enrollment, c.student_count, 0) AS current_enrollment,
  c.class_teacher_id,
  COALESCE(c.academic_year, '')::TEXT AS academic_year,
  COALESCE(c.status, 'active')::TEXT AS status,
  c.created_at,
  c.updated_at,
  t.first_name AS teacher_first_name,
  t.last_name AS teacher_last_name
FROM public.classes c
LEFT JOIN public.teachers t ON t.id = c.class_teacher_id;

-- 13) Add missing RLS policies for INSERT, UPDATE, DELETE operations
-- Note: Client-side code uses anon key (not service role), so RLS policies are required
-- These policies are permissive for now - can be tightened based on security requirements

DO $$ BEGIN
  CREATE POLICY classes_insert_all ON public.classes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY classes_update_all ON public.classes FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY classes_delete_all ON public.classes FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

