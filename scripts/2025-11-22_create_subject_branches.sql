-- ========================================
-- CREATE SUBJECT_BRANCHES TABLE
-- ========================================
-- This table stores subject branches (e.g., Mathematics - Algebra, Mathematics - Geometry)
-- Required for teacher_branch_assignments

-- Create the table
CREATE TABLE IF NOT EXISTS public.subject_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(50),
    description TEXT,
    weight_percentage NUMERIC(5,2) CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    is_optional BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique branch names per subject
    UNIQUE(subject_id, branch_name, academic_year, term)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subject_branches_subject_id ON public.subject_branches(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_branches_is_active ON public.subject_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_subject_branches_academic_year_term ON public.subject_branches(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_subject_branches_active_subject 
ON public.subject_branches(subject_id, is_active) 
WHERE is_active = true;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_subject_branches_set_updated_at ON public.subject_branches;
CREATE TRIGGER trg_subject_branches_set_updated_at
    BEFORE UPDATE ON public.subject_branches
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.subject_branches ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
DO $$ BEGIN
    CREATE POLICY subject_branches_select_all 
    ON public.subject_branches 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_insert_all 
    ON public.subject_branches 
    FOR INSERT 
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_update_all 
    ON public.subject_branches 
    FOR UPDATE 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_delete_all 
    ON public.subject_branches 
    FOR DELETE 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify table was created
SELECT 
    'subject_branches' as table_name,
    COUNT(*) as row_count
FROM public.subject_branches;

-- Show indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'subject_branches'
ORDER BY indexname;

