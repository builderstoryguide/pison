-- ========================================
-- COMPLETE SETUP FOR TEACHER ASSIGNMENTS
-- ========================================
-- Run this script to create all required tables and indexes
-- for the teacher assignments system to work properly

-- STEP 1: Ensure prerequisite tables exist
-- ========================================

-- Check if subjects table exists, if not create basic version
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    coefficient NUMERIC(5,2) DEFAULT 1.0,
    description TEXT,
    subsystem VARCHAR(20) CHECK (subsystem IN ('english', 'french')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if classes table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
        RAISE NOTICE 'Classes table does not exist. Please run the classes migration script first.';
    END IF;
END $$;

-- Check if teachers table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
        RAISE NOTICE 'Teachers table does not exist. Please run the teachers migration script first.';
    END IF;
END $$;

-- STEP 2: Create subject_branches table
-- ========================================
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

-- STEP 3: Create teacher_branch_assignments table
-- ========================================
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

-- STEP 4: Create performance indexes
-- ========================================

-- Indexes for subject_branches
CREATE INDEX IF NOT EXISTS idx_subject_branches_subject_id ON public.subject_branches(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_branches_is_active ON public.subject_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_subject_branches_academic_year_term ON public.subject_branches(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_subject_branches_active_subject 
ON public.subject_branches(subject_id, is_active) 
WHERE is_active = true;

-- Indexes for teacher_branch_assignments (CRITICAL FOR PERFORMANCE)
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

-- STEP 5: Create triggers
-- ========================================

-- Trigger for subject_branches
DROP TRIGGER IF EXISTS trg_subject_branches_set_updated_at ON public.subject_branches;
CREATE TRIGGER trg_subject_branches_set_updated_at
    BEFORE UPDATE ON public.subject_branches
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for teacher_branch_assignments
DROP TRIGGER IF EXISTS trg_teacher_branch_assignments_set_updated_at ON public.teacher_branch_assignments;
CREATE TRIGGER trg_teacher_branch_assignments_set_updated_at
    BEFORE UPDATE ON public.teacher_branch_assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STEP 6: Enable Row Level Security
-- ========================================

-- RLS for subject_branches
ALTER TABLE public.subject_branches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY subject_branches_select_all ON public.subject_branches FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_insert_all ON public.subject_branches FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_update_all ON public.subject_branches FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY subject_branches_delete_all ON public.subject_branches FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS for teacher_branch_assignments
ALTER TABLE public.teacher_branch_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_select_all ON public.teacher_branch_assignments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_insert_all ON public.teacher_branch_assignments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_update_all ON public.teacher_branch_assignments FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY teacher_branch_assignments_delete_all ON public.teacher_branch_assignments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STEP 7: Verify setup
-- ========================================

-- Check all tables exist
DO $$ 
DECLARE
    missing_tables TEXT[] := '{}';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
        missing_tables := array_append(missing_tables, 'subjects');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subject_branches') THEN
        missing_tables := array_append(missing_tables, 'subject_branches');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_branch_assignments') THEN
        missing_tables := array_append(missing_tables, 'teacher_branch_assignments');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
        missing_tables := array_append(missing_tables, 'teachers');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
        missing_tables := array_append(missing_tables, 'classes');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'Some tables are missing. Please run the prerequisite migration scripts.';
    ELSE
        RAISE NOTICE '✅ All required tables exist!';
    END IF;
END $$;

-- Show table row counts
SELECT 
    'subjects' as table_name,
    COUNT(*) as row_count
FROM public.subjects
UNION ALL
SELECT 
    'subject_branches' as table_name,
    COUNT(*) as row_count
FROM public.subject_branches
UNION ALL
SELECT 
    'teacher_branch_assignments' as table_name,
    COUNT(*) as row_count
FROM public.teacher_branch_assignments
UNION ALL
SELECT 
    'teachers' as table_name,
    COUNT(*) as row_count
FROM public.teachers
UNION ALL
SELECT 
    'classes' as table_name,
    COUNT(*) as row_count
FROM public.classes;

-- Show indexes on critical tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('subject_branches', 'teacher_branch_assignments')
ORDER BY tablename, indexname;

-- Final message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Setup complete! You can now run diagnose-performance.sql';
END $$;

