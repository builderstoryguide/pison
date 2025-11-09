-- Add user_id column to teachers table to link to users table
-- This enables the assignments API to properly link teachers to their user accounts

-- 1) Add user_id column if missing
DO $$ BEGIN
  ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id UUID NULL;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 2) Add foreign key to users(id)
DO $$ BEGIN
  ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Create index for performance
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

-- 4) Add comment for documentation
COMMENT ON COLUMN public.teachers.user_id IS 'Links teacher record to users table for authentication and authorization';
