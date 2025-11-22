-- ========================================
-- CREATE TEACHER_BRANCH_ASSIGNMENTS TABLE
-- ========================================
-- This table is CRITICAL for the teacher assignments API
-- It links teachers to subject branches and classes

-- Create the table
CREATE TABLE IF NOT EXISTS public.teacher_branch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.subject_branches(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    is_primary_teacher BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a teacher can't be assigned to the same branch/class/term combination twice
    UNIQUE(teacher_id, branch_id, class_id, academic_year, term)
);

-- Create indexes for performance (CRITICAL for query speed)
CREATE INDEX IF NOT EXISTS idx_tba_teacher_id ON public.teacher_branch_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tba_branch_id ON public.teacher_branch_assignments(branch_id);
CREATE INDEX IF NOT EXISTS idx_tba_class_id ON public.teacher_branch_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_tba_status ON public.teacher_branch_assignments(status);
CREATE INDEX IF NOT EXISTS idx_tba_academic_year_term ON public.teacher_branch_assignments(academic_year, term);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tba_teacher_status 
ON public.teacher_branch_assignments(teacher_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tba_teacher_class_status 
ON public.teacher_branch_assignments(teacher_id, class_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tba_class_academic_year 
ON public.teacher_branch_assignments(class_id, academic_year, term);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_teacher_branch_assignments_set_updated_at ON public.teacher_branch_assignments;
CREATE TRIGGER trg_teacher_branch_assignments_set_updated_at
    BEFORE UPDATE ON public.teacher_branch_assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.teacher_branch_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_select_all 
    ON public.teacher_branch_assignments 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_insert_all 
    ON public.teacher_branch_assignments 
    FOR INSERT 
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_update_all 
    ON public.teacher_branch_assignments 
    FOR UPDATE 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_delete_all 
    ON public.teacher_branch_assignments 
    FOR DELETE 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify table was created
SELECT 
    'teacher_branch_assignments' as table_name,
    COUNT(*) as row_count
FROM public.teacher_branch_assignments;

-- Show indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'teacher_branch_assignments'
ORDER BY indexname;

