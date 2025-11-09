-- Subject Management with Sub-Branches Schema
-- This script extends the subjects table to support sub-branches
-- and updates related tables to support the new structure

-- Update subjects table to support sub-branches
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS has_sub_branches BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS coefficient NUMERIC(5,2) DEFAULT 1.0 CHECK (coefficient > 0),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Set default coefficient for existing subjects
UPDATE public.subjects 
SET coefficient = 1.0 
WHERE coefficient IS NULL;

-- Make coefficient NOT NULL after setting defaults
ALTER TABLE public.subjects 
ALTER COLUMN coefficient SET NOT NULL,
ALTER COLUMN coefficient SET DEFAULT 1.0;

-- Create subject_sub_branches table
CREATE TABLE IF NOT EXISTS public.subject_sub_branches (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
	name VARCHAR(100) NOT NULL,
	coefficient NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (coefficient > 0),
	description TEXT,
	is_active BOOLEAN NOT NULL DEFAULT true,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(subject_id, name)
);

-- Update teacher_subjects table to support sub-branch assignments
ALTER TABLE public.teacher_subjects
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.subject_sub_branches(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) CHECK (assignment_type IN ('main_subject', 'sub_branch')) DEFAULT 'main_subject';

-- Update assessments table to support sub-branch assignments
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.subject_sub_branches(id) ON DELETE SET NULL;

-- Add trigger for updated_at on subjects table
DROP TRIGGER IF EXISTS trg_subjects_set_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_set_updated_at
	BEFORE UPDATE ON public.subjects
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add trigger for updated_at on subject_sub_branches table
DROP TRIGGER IF EXISTS trg_subject_sub_branches_set_updated_at ON public.subject_sub_branches;
CREATE TRIGGER trg_subject_sub_branches_set_updated_at
	BEFORE UPDATE ON public.subject_sub_branches
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_has_sub_branches ON public.subjects(has_sub_branches);
CREATE INDEX IF NOT EXISTS idx_subject_sub_branches_subject_id ON public.subject_sub_branches(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_sub_branches_is_active ON public.subject_sub_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON public.teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_sub_branch_id ON public.teacher_subjects(sub_branch_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON public.assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_sub_branch_id ON public.assessments(sub_branch_id);

-- Migration: Update existing teacher_subjects to link to subjects table if possible
-- This is a best-effort migration - subject_name may not match exactly
UPDATE public.teacher_subjects ts
SET subject_id = (
	SELECT id FROM public.subjects s 
	WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(ts.subject_name))
	LIMIT 1
)
WHERE ts.subject_id IS NULL AND ts.subject_name IS NOT NULL;

-- Migration: Mark existing subjects with sub-branches flag as false
-- (They will be updated when sub-branches are added through the UI)
UPDATE public.subjects 
SET has_sub_branches = false
WHERE has_sub_branches IS NULL;

-- Enable RLS (Row Level Security)
DO $$ BEGIN
	EXECUTE 'ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subjects_select_all ON public.subjects FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subjects_insert_all ON public.subjects FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subjects_update_all ON public.subjects FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subjects_delete_all ON public.subjects FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	EXECUTE 'ALTER TABLE public.subject_sub_branches ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subject_sub_branches_select_all ON public.subject_sub_branches FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subject_sub_branches_insert_all ON public.subject_sub_branches FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subject_sub_branches_update_all ON public.subject_sub_branches FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY subject_sub_branches_delete_all ON public.subject_sub_branches FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

