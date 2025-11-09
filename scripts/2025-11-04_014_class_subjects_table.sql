-- Create class_subjects junction table with trade subject support
-- This table links classes to subjects and tracks which subjects are trade subjects

-- Create class_subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_subjects (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
	subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
	is_trade_subject BOOLEAN NOT NULL DEFAULT false,
	academic_year VARCHAR(20),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(class_id, subject_id, academic_year)
);

-- Add subject_name column if it exists (for backward compatibility during migration)
-- This allows us to migrate existing data from subject_name to subject_id
DO $$ BEGIN
  ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS subject_name VARCHAR(100);
EXCEPTION WHEN others THEN NULL; END $$;

-- Migrate existing data: If subject_name exists but subject_id is NULL, try to find matching subject
DO $$ BEGIN
  UPDATE public.class_subjects cs
  SET subject_id = (
    SELECT id FROM public.subjects s 
    WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(cs.subject_name))
    LIMIT 1
  )
  WHERE cs.subject_id IS NULL AND cs.subject_name IS NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_is_trade_subject ON public.class_subjects(is_trade_subject);
CREATE INDEX IF NOT EXISTS idx_class_subjects_academic_year ON public.class_subjects(academic_year);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trg_class_subjects_set_updated_at ON public.class_subjects;
CREATE TRIGGER trg_class_subjects_set_updated_at
	BEFORE UPDATE ON public.class_subjects
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS (Row Level Security)
DO $$ BEGIN
	EXECUTE 'ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

-- RLS Policies
DO $$ BEGIN
	CREATE POLICY class_subjects_select_all ON public.class_subjects FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY class_subjects_insert_all ON public.class_subjects FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY class_subjects_update_all ON public.class_subjects FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY class_subjects_delete_all ON public.class_subjects FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

